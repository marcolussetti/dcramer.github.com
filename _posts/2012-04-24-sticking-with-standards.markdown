---
layout: post
title: "Sticking With Standards"
date: 2012-04-24 22:23
comments: true
categories: ["django", "disqus", "python"]
---

<p>More and more I'm seeing the "requirements.txt pattern" come up. This generally refers to projects (but not just), and
seems to have started around the same time as Heroku adopting Python. I feel like this is something that matters in the
Python world, and because I have an opinion on everything, I want to share mine.</p>

<h3>requirements.txt</h3>

<p>Let's first talk about what this pattern actually is. As you should already be familiar with pip (if you're not, this
post is not for you), the idea of this is that whatever you're doing, is installable by pointing pip at a requirements.txt
file which contains a list of your projects dependencies. This has some obvious benefits, one being that you can
mark repositories as dependencies.</p>

<p>Another benefit of this is when you have a large project (like DISQUS) and your dependencies can vary between environments. For
example, we have several various requirements files for disqus-web (our largest package):</p>

<pre>
requirements/global.txt
requirements/production.txt
requirements/development.txt
</pre>

<p>These end up being pretty obvious, and when an app has specific needs there's no reason not to approach the problem this
way. That said, you dont <strong>need</strong> to do things this way, and in every project other than our main repository,
including our open source work, all dependencies are specified completely in setup.py. Even in this case, we could just
as easily specify our core requirements as part of the package and simply have additional files which label the production
and development dependencies.</p>

<h3>setup.py is the right choice</h3>

<p>A common argument for not using setup.py is that a library is not the same as an app (or larger project). Why not? We
employ the same metadata in everything. Each contains a list of dependencies, some various metadata, and possibly a list
of extra resources (such as scripts, or documentation). Fundamentally they're identical. Additionally, if pip is your
thing, it <strong>does not prevent you from using setup.py</strong>. Let's take an example setup.py:</p>

{% highlight python %}
from setuptools import setup, find_packages

requires = [
    'Flask==0.8',
    'redis==2.4.11',
    'hiredis==0.1.1',
    'nydus==0.8.1',
]


setup(
    name='something-sexy',
    version='1.0.0',
    author="DISQUS",
    author_email="dev@disqus.com",
    package_dir={'': 'src'},
    packages=find_packages("src"),
    install_requires=requires,
    zip_safe=False,
)
{% endhighlight %}

<p>Now, in our case, this is probably a service on Disqus, which means we're not listing it as a dependancy. In every
single scenario we have, we want our package to be on <code>PYTHONPATH</code>, and this is no different. There's many ways
to solve the problem, and generally adjusting <code>sys.path</code> is not what you're going to want. Whether you install
the package or you just run it as an editable package (via pip install -e or setuptool's develop command), packaging
your app makes it that much easier.</p>

<p>What's even more important is that you <strong>stick with standards</strong>, especially in our growing ecosystem of
open source and widely available libraries. There's absolutely no reason to have to explain to a developer that they
need to run some arbitrary command to get your neat tool to install. Following the well defined and adopted standards
ensures that is never the case.</p>

<p>Keep it simple. Keep it obvious.</p>
