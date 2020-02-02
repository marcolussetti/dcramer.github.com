---
layout: post
title: "Distributing 3rd party JavaScript with Python Packages"
date: 2014-12-19 12:25
comments: true
categories: [  ]
---

For a long time now we've had this annoying challenge of distributing a bunch of vendored and compiled JavaScript with [Sentry](https://www.getsentry.com). What made this especially challenging was the fact that we both needed it to be fast/dynamic in development, shippable to getsentry.com via standard means, and even more importantly distributed as part of the open source release.

Old school thinking
-------------------

Our first solution to this was to use various tools in Django (the framework Sentry is written on top of). We tried out most of the popular solutions at the time and none of them really solved our problem:

We need to be able to **ship** the minified and compiled sources.

A couple came close, but even they were limited in certain areas, like their ability to correctly build source maps. In the end we rolled our own: [django-static-compiler](https://github.com/dcramer/django-static-compiler).

This worked for the most part. There were a couple of caveats to it:

- It required us to ``git commit`` our compiled media (i.e. the minified JS)
- The logic eventually become so hard to follow that improving the project was difficult


Replacing vendored modules with Bower
-------------------------------------

The first thing we did was remove a majority of our committed (vendored) modules. We were able to quickly swap in Bower for these:

{% highlight javascript %}
// bower.json

{
  "name": "sentry",
  "repository": {
    "type": "git",
    "url": "git://github.com/getsentry/sentry.git"
  },
  "private": true,
  "dependencies": {
    "bootstrap": "~2.3.2",
    "jquery": "~2.1.0",
    "jquery-flot": "~0.8.3",
    "moment": "~2.1.0",
    "simple-slider": "https://github.com/loopj/jquery-simple-slider.git",
    "platformicons": "1.0.2",
    "raven-js": "~1.1.16"
  },
  "resolutions": {
    "bootstrap": "~2.3.2",
    "jquery": "~2.1.0"
  }
}
{% endhighlight %}

We also make one small change to the default bower configuration, as we don't really care for the arbitrary ``bower_components`` path:

{% highlight javascript %}
// .bowerrc

{
	"directory": "src/sentry/static/sentry/vendor/"
}
{% endhighlight %}

Now a simple ``bower install`` pulls down our vendored modules. The caveat here is we're relying on the upstream providers to maintain those versions, but the community is generally good about that.


Transitioning to Gulp
---------------------

To swap out our compilers (less and uglify) we pulled in Gulp. We had a few different bundles and there didn't seem to be an obvious way to do this kind of stuff in Gulp. Fortunately, it's just code, so we were able to roll our own:

{% highlight javascript %}
// gulpfile.js

function buildJsCompileTask(name, fileList) {
  function(){
    return gulp.src(fileList)
      .pipe(gp_cached('js-' + name))
      .pipe(gp_concat(name + ".js"))
      .pipe(gulp.dest(distPath))
      .pipe(gp_uglify())
      .pipe(gp_rename(name + ".min.js"))
      .pipe(gulp.dest(distPath))
      .on("error", gp_util.log);
  };
}
{% endhighlight %}

Then it became as simple as providing a configuration and looping through the bundles:

{% highlight javascript %}
var jsDistros = {
  "app": [
    file("scripts/core.js"),
    file("scripts/models.js"),
    file("scripts/templates.js"),
    file("scripts/utils.js"),
    file("scripts/collections.js"),
    file("scripts/charts.js"),
    file("scripts/views.js"),
    file("scripts/app.js")
  ],

  // ...
}

var jsDistroNames = [], jsTask;
for (var distroName in jsDistros) {
  jsTask = buildJsCompileTask(distroName, jsDistros[distroName]);
  gulp.task("dist:js:" + distroName, jsTask);
}
{% endhighlight %}

Additionally there's [various code](https://github.com/getsentry/sentry/blob/master/gulpfile.js) to wire these up so theres a general ``gulp dist:js`` as well as a ``gulp dist`` helper.

Distributing the Bundles
------------------------

The final piece of the puzzle was finding a reasonable solution to actually distribute the bundles. In our case this means that the dist files need to actually be pushed up with our Python tarball, ideally with the same tools we use today.

It was fairly evident we needed to override 'sdist' (as we upload source distros) as well as 'develop' (which is approximately the equivilent of a local source distro). Because we use setuptools, this was fairly easy:

{% highlight python %}
# setup.py

from distutils import log
from distutils.core import Command
from setuptools import setup
from setuptools.command.develop import develop
from setuptools.command.sdist import sdist


class DevelopWithBuildStatic(develop):
    def install_for_development(self):
        self.run_command('build_static')
        return develop.install_for_development(self)


class SdistWithBuildStatic(sdist):
    def make_distribution(self):
        self.run_command('build_static')
        return sdist.make_distribution(self)


class BuildStatic(Command):
    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def run(self):
        log.info("running [npm install --quiet]")
        check_output(['npm', 'install', '--quiet'], cwd=ROOT)

        log.info("running [gulp dist]")
        check_output([os.path.join(ROOT, 'node_modules', '.bin', 'gulp'), 'dist'], cwd=ROOT)

setup(
	# ...
    cmdclass={
        'build_static': BuildStatic,
        'develop': DevelopWithBuildStatic,
        'sdist': SdistWithBuildStatic,
    },
)
{% endhighlight %}

That's it! This adds a ``build_static`` command that can be run with setup.py:

{% highlight bash %}
$ python setup.py build_static
{% endhighlight %}

It will also ensure this command is run as part of both ``develop`` and ``sdist``.


Wrapping Up
-----------

While the integration isn't the cleanest in Python, we're really stuck working with the tools made available to us. Ideally setuptools would provide generic build hooks that made more sense. As an example, we might want to support doing a ``pip install`` from a GitHub repo (or a source tarball) which becomes much more complicated. To do that we need a custom install command which would check if it actually can or needs to run the ``build_static`` command.

We also haven't gotten sourcemaps working again. These seem to be the most brittle part of any build system as the complexities around paths generally aren't planned for by the tools that integrate support for these.

With that said, we hit all of our goals with this change, so mission accomplished.

(A side note, all of Sentry is open source, so if you're curious you can [view the entirety of what we're doing on GitHub](https://github.com/getsentry/sentry))
