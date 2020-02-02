---
layout: post
title: "Scaling SQL with Redis"
date: 2014-05-12 21:53
comments: true
categories: [ "sql", "redis", "sentry" ]
---

I love Redis. It's one of those technologies that is so obvious it makes you wonder why it took so long for someone to build it. Predictable, performant, and adapatable, it's something I've come to use more and more over the last few years. It's also no secret that Sentry is run primarily on PostgreSQL (though it now also relies on a number of other technologies).

A little over a week ago I gave a keynote at <a href="http://2014.pythonnordeste.org/">Python Nordeste</a>. At some point it was suggested I give a lightning talk. I decided I'd talk about some of the cool hacks we use to scale Sentry, specifically with Redis. This post is an expanded version of that five minute talk.


Alleviating Row Contention
--------------------------

Something we adopted early on in Sentry development was what's become known as <a href="https://github.com/getsentry/sentry/blob/master/src/sentry/buffer/redis.py">sentry.buffers</a>. It's a simple system which allows us to implement very efficient buffered counters with a simple <a href="http://en.wikipedia.org/wiki/Eventual_consistency">Last Write Wins</a> strategy. It's important to note that we completely eliminate almost any form of durability with this (which is very acceptable for the way Sentry works).

The operations are fairly straightforward, and whenever an update comes in we do the following:

1. Create a hash key bound to the given entity
2. Increment 'counter' using HINCRBY
3. HSET any various LWW data (such as "last time seen")
4. ZADD the hash key to a 'pending' set using the current timestamp

Now every tick (in Sentry's case this is 10 seconds) we're going to dump these buffers and fanout the writes. This looks like the following:

1. Get all keys using ZRANGE
2. Fire off a job into RabbitMQ for each pending key
3. ZREM the given keys

Now the RabbitMQ job will be able to fetch and clear the hash, and the 'pending' update has already been popped off of the set. There's a few things to note here:

- We use a sorted set for the case where we would want to only pop off a set amount (e.g. we want to process the 100 oldest).
- If we end up with multiple queued jobs to process a key, one could get no-oped due to another already processing and removing the hash.
- The system scales consistently on many Redis nodes simply by putting a 'pending' key on each node.

With this model we <strong>mostly guarantee</strong> that only a single row in SQL is being updated at once, which alleviates most locking contention that we'd see. This greatly benefits Sentry given that it might deal with a burst of data that all ends up grouping together into the same counter.

Rate Limiting
-------------

Due to the nature of Sentry we end up dealing with a constant <a href="http://en.wikipedia.org/wiki/Denial-of-service_attack">denial-of-service attack</a>. We've combatted this with a number of rate limiters, one of which is powered by Redis. This is definitely one the more straight forward implementations and lives within <a href="https://github.com/getsentry/sentry/blob/master/src/sentry/quotas/redis.py">sentry.quotas</a>.

The logic is very straight forward, and looks something like this:

{% highlight python %}
def incr_and_check_limit(user_id, limit):
    key = '{user_id}:{epoch}'.format(user_id, int(time() / 60))

    pipe = redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, 60)
    current_rate, _ = pipe.execute()

    return int(current_rate) > limit
{% endhighlight %}

The way we do rate limiting illustrates one of the most fundamental benefits of Redis over memcache: incr's on empty keys. To achieve the same behavior in memcache would likely end up with this kind of approach:

{% highlight python %}
def incr_and_check_limit_memcache(user_id, limit):
    key = '{user_id}:{epoch}'.format(user_id, int(time() / 60))

    if cache.add(key, 0, 60):
        return False

    current_rate = cache.incr(key)

    return current_rate > limit
{% endhighlight %}

We actually end up employing this strategy on a few various things within Sentry to do short-term data tracking. In one such case we actually store the users data in a sorted set so we can quickly find the most active users within a short time period.

Basic Locks
-----------

While Redis isn't highly available, our use case for locks makes it a good tool for the job. We don't use them in Sentry's core anymore, but an example use case was where we wanted to minimize concurrency and to simply no-op an operation if something appeared to be running already. This can be useful for cron-like tasks that may need to execute every so often, but don't have strong coordination.

In Redis doing this is fairly simple using the SETNX operation:

{% highlight python %}
from contextlib import contextmanager

r = Redis()

@contextmanager
def lock(key, nowait=True):
    while not r.setnx(key, '1'):
        if nowait:
            raise Locked('try again soon!')
        sleep(0.01)

    # limit lock time to 10 seconds
    r.expire(key, 10)

    # do something crazy
    yield

    # explicitly unlock
    r.delete(key)
{% endhighlight %}

While the <a href="https://github.com/getsentry/sentry/blob/master/src/sentry/utils/cache.py">Lock() within Sentry</a> makes use of memcached, there's absolutely no reason we couldn't switch it over to Redis.


Time Series Data
----------------

Recently we wrote a new mechanism for storing time-series data in Sentry (contained in <a href="https://github.com/getsentry/sentry/blob/master/src/sentry/tsdb/redis.py">sentry.tsdb</a>). This was heavily inspired by RRD models, specifically Graphite. We wanted a simple and fast way to store short-period (e.g. one month) time-series data that would allow us to handle very high throughput for writes, and allow us extremely low latency for computing short-term rates. While this is the first model where we actually want to persist data in Redis, it's yet another simple case of using counters.

Our current model stores an entire interval's series within a single hash map. For example, this means all counts for a given key-type and for a given 1-second live in the same hash key. It looks something like this:

{% highlight json %}
{
    "<type enum>:<epoch>:<shard number>": {
        "<id>": <count>
    }
}
{% endhighlight %}

So in our case, let's say we're tracking the number of events. Our enum maps the Event type to "1". The resolution is 1s so our epoch is simply the current time in seconds. The hash ends up looking something like this:


{% highlight json %}
{
    "1:1399958363:0": {
        "1": 53,
        "2": 72,
    }
}
{% endhighlight %}

An alterative model might just use simple keys and just perform incrs on those buckets:

{% highlight json %}
    "1:1399958363:0:1": 53
{% endhighlight %}

We chose the hash map model for two reasons:

- We can TTL the entire key at once (this also has negative side effects, but so far has been stable).
- The key gets <strong>greatly compressed</strong>, which is a fairly significant deal.

Additionally, the shard number key allows us to distribute a single bucket over a fixed number of virtual shards (we use 64, which map to 32 physical nodes).

Now querying the data is done using <a href="https://github.com/disqus/nydus">Nydus</a> and it's <code>map()</code> (which relies on a worker pool). The code is pretty hefty for this operation, but hopefully it's not too overwhelming:


{% highlight python %}
def get_range(self, model, keys, start, end, rollup=None):
    """
    To get a range of data for group ID=[1, 2, 3]:

    Start and end are both inclusive.

    >>> now = timezone.now()
    >>> get_keys(tsdb.models.group, [1, 2, 3],
    >>>          start=now - timedelta(days=1),
    >>>          end=now)
    """
    normalize_to_epoch = self.normalize_to_epoch
    normalize_to_rollup = self.normalize_to_rollup
    make_key = self.make_key

    if rollup is None:
        rollup = self.get_optimal_rollup(start, end)

    results = []
    timestamp = end
    with self.conn.map() as conn:
        while timestamp >= start:
            real_epoch = normalize_to_epoch(timestamp, rollup)
            norm_epoch = normalize_to_rollup(timestamp, rollup)

            for key in keys:
                model_key = self.get_model_key(key)
                hash_key = make_key(model, norm_epoch, model_key)
                results.append((real_epoch, key, conn.hget(hash_key, model_key)))

            timestamp = timestamp - timedelta(seconds=rollup)

    results_by_key = defaultdict(dict)
    for epoch, key, count in results:
        results_by_key[key][epoch] = int(count or 0)

    for key, points in results_by_key.iteritems():
        results_by_key[key] = sorted(points.items())
    return dict(results_by_key)
{% endhighlight %}

It boils down to the following:

- Generate all of the required keys.
- Using the worker pool, fetch all of the results in the minimum number of network operations (Nydus takes care of this).
- Given the results, map them to a result set that represents the buckets based on the given intervals, and the given keys.

Simple Choices
--------------

I'm a huge fan of simple solutions to problems, and Redis definitely fits in that bucket. It's <a href="http://redis.io/commands">documentation</a> is amazing, and it's the lowest barrier of entry you're going to find outside of something like memcached. While it has its tradeoffs (primarily if you're using it with persistence), they're up front and fairly straight forward.

What can Redis solve for you?
