---
layout: post
title: "Choosing Angular.js"
date: 2014-05-14 21:34
comments: true
categories: [ "angular", "sentry" ]
---

It's been almost a year since I joined Dropbox. In that time I've been almost entirely focused on our automated build system (we dubbed it <a href="https://github.com/dropbox/changes">Changes</a>). Early on I made the decision to use Angular.js for the project. I had the hopes that it would make it easy to make a real-time frontend without all the hassle that you'd have to go through for something like Backbone.

About three months ago I also began exploring Ember.js for a rewrite of the frontend on <a href="https://getsentry.com">Sentry</a>. I took a week off and tried to really dive into Ember, and before the end the week had migrated that project to Angular as well.

I wanted to take this time to explain why I think Angular.js has been a great choice, and some of the lessons I've learned along the way.

Ember from Angular
------------------

I had been working with Angular for about 5 months at this point. We had struggled through the process of getting require.js working, managed to reasonably modularize our code, and had discovered some of the great ecosystem that exists for Angular open-source.

On top of that, I quickly discovered how painful Angular's dirty checking can be.

If you're not familiar, one of the fundamental differences within Angular.js (vs almost any other framework) is the way it does state change. It installs things called watchers on any object in scope and at various periods of time will iterate through selected watchers and check to see if they have changed. If and when things change, it will then propagate the changes out (to your templates and components).

For obvious reasons the dirty checking can be very expensive. Ember.js does away with this and uses a standard getter/setter pattern, and provides a lot of the same kind of features. For that reason alone, it was worthwhile for us to explore using Ember.

Unfortunately, Ember.js also prescribes a way of doing things, and makes it much more difficult to break out of that pattern. I like to think of myself as a capable architect, and I was more than grumpy about the patterns enforced on me in Ember.js. About half-way through my vacation I scrapped all of the code we had written and had switched over to Angular.

Modularizing Angular
--------------------

I have a fairly strong opinion on, well, almost everything. The organization of my Python-esque JavaScript was no different.

To start with, I absolutely did not want to deal with pre-compilers or monolithic JavaScript files. Ember for example recommends using ES6 modules, which might be fine when we can actually use ES6, but is a nightmare to build into an existing project. Angular has it's own module loader, but it's easy to break away from it. Most importantly, finding resources to use AMD with Ember was extremely difficult.

The module loader becomes important when you look at how our code has evolved over time. Before jumping into that though, let's look at what I would consider a "module":

- Some kind of routing logic (specifically, accepted parameters).
- The controller, which acts as an initializer.
- The scope for the controller, or in our case the template when applicable.
- Initialization logic, usually based on the parameters from the route.

All of these components are actually separate in both systems. On top of that, Ember.js adds a couple of other abstractions on things that you either get implicitly with Angular, or you simply don't need.

Our goal was to somehow build modules out of these components, and keep them tighly coupled. When logic that is together, lives together, it becomes much more obvious what's going on to the unfamiliar.

Discoveries
-----------

Early on started bundling controllers in AMD modules with a central routes.js that would register them. The routes would also register resolvers, which are an unfortunate way to send initialization data. To quickly demonstrate this, here's what we probably had at this point:

{% highlight javascript %}
// routes.js

define([
    'app',
    'controllers/index'
], function(app, IndexCtrl) {
    app.config(function($routeProvider) {
        $routeProvider.route('/', {
            templateUrl: 'index.html',
            controller: IndexCtrl,
            resolve: {
                projectList: function($http) {
                    return $http.get('/api/0/projects/');
                }
            }
        });
    });
});
{% endhighlight %}

Now for obvious reasons it gets pretty frustrating when you're embedding a bunch of API calls in your routing logic. It took far too long to come to this solution, but since we weren't using named controllers, why don't we just bundle the entire route object into the module?

Quickly we started shifting towards the bundled model. While it doesn't contain the URL, it at least lets us encapsulate a majority of the logic:

{% highlight javascript %}
// routes/index.js

define([
    'app',
], function(app) {
    return {
        templateUrl: 'index.html',
        controller: function($scope, projectList) {
            $scope.projectList = projectList.data;
        },
        resolve: {
            projectList: function($http) {
                return $http.get('/api/0/projects/');
            }
        }
    });
});
{% endhighlight %}

States
------

Shortly after we had started shuffling things around we were introduced to the <a href="https://github.com/angular-ui/ui-router">ui-router</a> project. It quickly fit right in with the paradigm we wanted: it abstracted things into "states", which were representations of named modules.

As an example, taking our route and converting it to a state was simple:

{% highlight javascript %}
// states/index.js

define([
    'app',
], function(app) {
    return {
        url: '/',
        templateUrl: 'index.html',
        controller: function($scope, projectList) {
            $scope.projectList = projectList.data;
        },
        resolve: {
            projectList: function($http) {
                return $http.get('/api/0/projects/');
            }
        }
    });
});
{% endhighlight %}

Registration is very similar, except that you now provide a name rather than a location:

{% highlight javascript %}
// routes.js

define([
    'app',
    'states/index'
], function(app, IndexState) {
    app.config(function($stateProvider) {
        $stateProvider.state('index', IndexState);
    });
});
{% endhighlight %}

What was even better is it started to let us encapsulate parameters in some of our other views:

{% highlight javascript %}
// states/buildList.js

define([
    'app',
], function(app) {
    return {
        parent: 'index',
        url: '/builds/?sortBy'
        templateUrl: 'build-list.html',
        controller: function($scope, buildList) {
            $scope.buildList = buildList.data;
        },
        resolve: {
            buildList: function($http, $stateParams) {
                return $http.get('/api/0/builds/?sortBy=' + $stateParams.sortBy);
            }
        }
    });
});
{% endhighlight %}

In Closing
----------

I'm hoping to talk a lot more about Angular.js in the future. I'm even giving a workshop on Angular + Flask in <a href="https://pycon.sg/">Singapore</a> next month. It has some extremely interesting concepts like directives (they take some getting used to, but are amazing). A large number of our internal tools are now built with Angular, and it's made iteration and contribution extremely easy. As with any new technology, it's been an interesting learning curve. I wouldn't say we've made the best decisions possible, but they've worked out very well for us.

With any luck, I'll find more excuses to write about Angular, and various things we've gone through as we've been building out products using it.
