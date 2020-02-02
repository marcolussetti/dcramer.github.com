---
layout: post
title: "You Should Be Using Nginx + UWSGI"
date: 2013-06-27 13:50
comments: true
categories: [ "python", "django" ]
---

After lots of experimentation (between [disqus.com](http://disqus.com) and
[getsentry.com](https://www.getsentry.com)), I'm content with saying that
uwsgi should be the standard in the Python world. Combine it with nginx
and you're able to get a lot of (relative) performance out of your threaded
(or not) Python web application.

**Update:** Ignoring the age-old argument of "[whatever metric you give] is slow",
the requests I'm illustrating here are to the "Store" endpoint in Sentry, which
processes an input event (anywhere from 20kb to 1mb in size), makes several
network hops for various authorization and quota strategies, and then eventually
queues up some operations. tl;dr it offloads as much work as possible.

Serving Strategies
==================

There's quite a number of ways you can run a Python application. I'm not going
to include mod_wsgi, and most imporantly, I'm not trying to illustrate how
evented models work. I don't believe they're practical (yet) in the Python
world, so this topic is about a traditional threaded (or multi process) Python
application.

Instead, I'm going to focus on two of the most popular solutions, and two I'm
very familiar with, gunicorn, and uwsgi.

gunicorn
--------

When you move past mod_wsgi your solutions are basically only Python web
servers. One of the most popular (read: trendy) methods has been gunicorn
lately.

We actually still recommend using gunicorn for Sentry, but that's purely out
of inconvenience. It was pretty wasy to embed within Django, and setup was
simple.

It also has 10% of the configuration options as uwsgi (which might actually
be a good thing for some people).

Other than that, it provides nearly identical base featuresets to uwsgi (or any
other Python web server) for our comparative purposes.

uwsgi
-----

The only alternative, in my opinion, to gunicorn is uwsgi. It's slightly more
performant, has too many configuration options to ever understand, and also
gains the advantage of having a protocol that can communicate with nginx.

It's also fairly simple to setup if you can find an article on it, more on that
later.

I started running uwsgi with something like --processes=10 and --threads=10 to
try and max CPU on my servers. There were two goals here:

- Max CPU, which required us to...
- Reduce memory usage, which was possible because..
- Sentry is threadsafe, and threads are easy.

(For what it's worth, Disqus runs single threaded, but I'm cheap, and I wanted
to keep Sentry as lean as possible, which means squeezing capacity out of nodes)

Iterating to Success
====================

I was pretty proud when we got API response times down to 40ms on average. When
I say API I'm only talking about the time it takes from it hitting the Python
server, to the server returning it's response to the proxy.

Unfortunately, it quickly became apparent that there were capacity issues
when we started getting more traffic for larger spikes. We'd hit bumpy response
times that were no longer consistent, but we still had about 30% memory and 60%
cpu to spare on the web nodes.

After quite a few tweaks, what we eventually settled on was managing a larger
amount of uwsgi processes, and letting nginx load balance them (vs letting
uwsgi itself load balance).

What this means, is that instead of doing uwsgi --processes=10, we ran 10
separate uwsgi processes.

The result was a beautiful, consistent 20ms average response time.

![API Times](/images/posts/consistent-api-times.png)

Putting It Together
===================

Because I like when people do more than talk, I wanted to leave everyone with
some snippets of code from our Chef recipes which we used to actually set all
of this up on the servers (with minimal effort).

nginx
-----

The first piece of configuration is Nginx. We need to actually programatically
add backends based on the number of uwsgi processes we're running, so things
became a bit more complicated.

We start by building up the list in our web recipe:

```ruby
# recipes/web.rb

hosts = (0..(node[:getsentry][:web][:processes] - 1)).to_a.map do |x|
  port = 9000 + x
  "127.0.0.1:#{port}"
end

template "#{node['nginx']['dir']}/sites-available/getsentry.com" do
  source "nginx/getsentry.erb"
  owner "root"
  group "root"
  variables(
    :hosts => hosts
  )
  mode 0644
  notifies :reload, "service[nginx]"
end
```

Then the nginx config becomes pretty straightforward:

```erb
# templates/getsentry.erb

upstream internal {
  least_conn;
<% @hosts.each do |host| %>
  server <%= host %>;
<% end %>
}

server {
  location / {
    uwsgi_pass         internal;

    uwsgi_param   Host                 $host;
    uwsgi_param   X-Real-IP            $remote_addr;
    uwsgi_param   X-Forwarded-For      $proxy_add_x_forwarded_for;
    uwsgi_param   X-Forwarded-Proto    $http_x_forwarded_proto;

    include uwsgi_params;
  }
}
```

We've now setup uwsgi to assign the number of hosts to the value of our
web processes, started at port 9000. It's also been configured to serve
uwsgi using it's socket protocol.

uwsgi
-----

On the other side of things, we're using supervisor to control our uwsgi
processes, so things are pretty straightforward here as well:


```ruby
# recipes/web.rb

command = "/srv/www/getsentry.com/env/bin/uwsgi -s 127.0.0.1:90%(process_num)02d --need-app --disable-logging --wsgi-file getsentry/wsgi.py --processes 1 --threads #{node['getsentry']['web']['threads']}"

supervisor_service "web" do
  directory "/srv/www/getsentry.com/current/"
  command command
  user "dcramer"
  stdout_logfile "syslog"
  stderr_logfile "syslog"
  startsecs 10
  stopsignal "QUIT"
  stopasgroup true
  killasgroup true
  process_name '%(program_name)s %(process_num)02d'
  numprocs node['getsentry']['web']['processes']
end
```

One Way, and Only One Way
=========================

Unless someone comes up with an extremely convincing argument why there should
be another way (or a situation where this can't work), I hope to hear this
pattern become more standard in the Python world. At the very least, I hope it
sparks some debates on how to improve process management inside of things like
uwsgi.

If you take nothing else away from this post, leave with the notiion that
**uwsgi is the only choice for serving threaded (or non) python web
applications**.

(I hastily wrote this post to illustrate some findings today, so pardon the
briefness and likely numerous typos)
