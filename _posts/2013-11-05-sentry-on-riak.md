---
layout: post
title: "Sentry on Riak"
date: 2013-11-05 21:21
comments: true
categories: [ "sentry", "django" ]
---

Over the course of [getsentry.com](https://getsentry.com/), one thing has become abundantly clear: you can never have too much disk space. In the 20 months it's been running, we've doubled our disk consumption six times. This may not sound like a big deal, but we've always tried to be tight on expenses, and it gets even more complicated when this is your primary database cluster.

Recently, with about two weeks remaining on our Postgres nodes, we decided to take a new approach to Sentry's datastores. That approach begins with introducing Riak.

Why Riak
========

We made the choice to conform to an extremely simple interface: get, set, and delete. A fairly standard interface, but more importantly one that nearly any data store on the planet can work with. With that decision made, Riak became an extremely simple and obvious solution. We wanted a datastore that was easily scalable, managing its own shards and routing. On top of this, Riak has always been something that I've been very fascinated with, but never really had an ideal usecase for.

sentry.nodestore
================

The introduction of Riak began with us refactoring event blob storage in Sentry. This storage made up 90% of our disk on the Postgres cluster, yet is only **read once for every 4000 writes**. To get started, we went back to our interface, and designed a very simple abstraction:


	class NodeStorage(object):
	    def delete(self, id):
	        """
	        >>> nodestore.delete('key1')
	        """

	    def get(self, id):
	        """
	        >>> data = nodestore.get('key1')
	        >>> print data
	        """

	    def set(self, id, data):
	        """
	        >>> nodestore.set('key1', {'foo': 'bar'})
	        """

Now implementing any kind of storage on top of this was very straight forward, and we were able to quickly whip up a Django backend (which stores things very similar to their previous behavior) as well as a Riak backend. Even better, [Travis CI](http://travis-ci.com) was the only thing that ever ran the integration tests against Riak itself.

Once we had a basic storage mechanism completed, we had to implement some transitional components. In this case, the majority of the code lives in something called ``NodeField``. While it's not great to look at, it manages automatically migrating old nodes into our new node storage whenever they are saved. The behavior is nearly identical, with one exception: we had to explicitly request nodes. We solved this by introducing a new helper function:

    event_list = group.event_set.all().order_by('-datetime')[:100]

    Event.objects.bind_nodes(event_list, 'data')

Behind the scenes, this calls out to ``nodestore.get_multi([node_ids])``.

Once done, we were able to access data just as before:

	for event in event_list
	    print event.data

Spinning up Riak
================

By far my favorite part of this experience was how painlessly Riak's clustering worked. I in fact, did very little in terms of production or capacity testing. A bit of Math gave us capacity specs for the servers, so it was as simple as:

- Pull down the Riak cookbook (Chef)
- Tell all nodes to join the cluster
- Run curl to ensure connectivity from web nodes
- Enable dual-write to Postgres + Riak (or as we call it, the just-in-case mechanism)

To my amazement things worked perfectly. Literally, Riak "just worked". We started by dual-writing to Riak and Postgres, and reading from Postgres, and within one hour we had transitioned to reading from Riak, and then quickly to removing Postgres altogether.

But all wasn't perfect. We jumped into it so quickly, that we slipped up on hardware verification, quickly to find out that there was a communication error and our servers had been misconfigured.

Moving to LevelDB
=================

We had provisioned cluster of 2x 800gb ssds, just to find out that somewhere there was a slipup and the drives didn't end up in the expected raid configuration (raid 0). On top of that, disk space was climbing at a rate of 120gb a day, which could quickly exhaust the collective space available on the cluster. Even more of an issue was that BitCask's memory consumption was higher than we had measured and we wouldn't even be able to use 60% of the 1.5tb expected to be available on each machine.

Now came the scary part: cycling all machines so we could reconfigure raid **and** adjusting the bucket's backend to run on eleveldb. After a bit of talking and researching, we found that the best way to migrate buckets was to remove a node from the cluster, change it's storage backend, and then have it rejoin (thus retransfering all data). Pulling the trigger on the first "leave the cluster" command was intimidating, but it worked flawlessly. From there it just required us to cycle through the machines to get them re-raided, and have them rejoin the cluster, one at a time.

After about 48 hours we had gone through each machine, smoothly transitioned each node to the new backend, and have plenty of capacity to get us through the forseeable future.

Scaling Out
===========

I'm super excited to see where we go with our node storage model. In the long term we're looking to expand out more things with a graph-like approach, which would allow us to continue to use SQL as an indexer (even clustered), but give us the freedom to push more things into the distributed context that tools like Riak provide us. More importantly, we've managed to keep Sentry just as simple as it was before for small users, and allow us to continue to grow getsentry.com.

Never would I have imagined that this would have been such a painless migration. The future is here.
