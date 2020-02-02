---
layout: post
title: "Introducing Zeus"
date: 2018-01-10 07:00 +0800
comments: true
categories: ["zeus"]
---

<div style="text-align: center; margin-bottom: 20px;">
    <img src="/images/posts/zeus/zeus.png" style="max-width: 300px" />
</div>

At [Sentry](https://sentry.io) we're big users of open source tooling. Specifically, our day-to-day engineering workflows are built on top of GitHub, Travis CI, and a number of other supporting tools. Unfortunately that workflow has often led us to being frustrated, and wasting what feels like countless hours in our change control process.

To understand the problems we see, let's first talk about what our Change Control Process is at Sentry:

1. You create a pull request with your changes
2. It must be peer-reviewed
3. It must pass a set of automated tests
4. Once all conditions have been passed, you can merge and deploy the change

The problems often come down to peer review and and automated testing. Peer review is always a social problem, so we're not going to talk about that right now, but our automated testing is completely machine driven and something we have full control over. One of the biggest issues we have with our tests is inconsistent results and parsing the failures when something is relevant.

There's a dance that you should all be far too familiar with where you see a build failing (likely an email from Travis), click it, wait 30 seconds for the log to load, scroll to the bottom, find the error is somewhere hundreds of lines up, and then eventually see the test thats failed (or the lint violation, or simply that NPM is broken yet again).

It doesn't have to be this way.

## Introducing Zeus

During my time at Dropbox one of my major initiatives was a build system we called Changes. It was both a distributed test runner, as well as a visualization of those results. All in all, it's was a pretty complex beast that really is only intended to be used at Dropbox. That said, the visualization component is something I've missed, and is sorely lacking in the tooling available to open source users. While its available to some degree through individual, specialized services, you have to login to each service separately (e.g. Codecov, Percy, Travis, Snyk, [...]) in order to see any kind of relevant results, and this doesn't even cover all of our needs.

Enter Zeus.

Half way through last year I had my plans for a long holiday weekend fall through. So instead of making new plans, I decided to scratch an itch, and started the foundation work for Zeus. We knew all we cared about was collecting build results and rendering them in a usable fashion. We wanted to answer "why is the build broken" without the user having to read logs.

<div class="img-frame">
    <img src="/images/posts/zeus/build-details.png"/>
</div>

It started as simply sending basic build/job details and then parsing junit XML results, and eventually led to supporting numerous other artifact formats (cobertura, checkstyle, webpack stats). Each bringing in their own unique set of concerns, but all visualized in a similar way. Most importantly, even with just this basic functionality, we had already nearly completed our primary objective: telling the developer why the build is failing:

<div class="img-frame">
    <img src="/images/posts/zeus/build-failure.png" />
</div>

(there are some cases, such as npm failures or other system issues that show up in the log that we can't easily capture via Travis)

Each component in Zeus will capture details within the build, and in some cases bubble those up into historical statistics to track over time. For example, here are webpack bundle statistics:

<div class="img-frame">
    <img src="/images/posts/zeus/webpack-bundle.png" />
</div>

It's important for us at Sentry that "code is run by tests". Those tests don't have to cover every possible variation of code, but to ensure a healthy balance between iteration speed and stability code at least needs to be executed. This is why one of the first things you see with every build is the coverage summary:

<div class="img-frame">
    <img src="/images/posts/zeus/code-coverage-summary.png" />
</div>

Another concern we've had is Selenium failures. We use these for a number of acceptance tests combined with [Percy](https://percy.io) for doing visual diffs. Unfortunately Selenium is often brittle, and even the Travis logs would give us no details why. Fret not, because now we can simply push the generated HTML artifact (from ``pytest``) to Zeus:

<div class="img-frame">
    <img src="/images/posts/zeus/artifact-list.png" />
</div>

Most importantly, the email we generate will also include the relevant failure details.

All of the above are concerns we see throughout our change control process, but still feel like the tip of the iceberg when it comes to what Zeus can achieve.

## Test Driving Zeus

Today our support is fairly limited if you want to use the service. You'll have to have a repository hosted on Github.com (not GitHub Enterprise), and its easiest if you're using Travis CI. That said, Travis isn't a requirement, and the underlying architecture isn't coupled to GitHub. Both of these are things we'd love the community's help with expanding.

If you **are** using GitHub and Travis, are ok with Sentry-operated machines having access to your source code, and want to take Zeus for a spin, here's what you do:

1. Be ok with 'yeah its mostly ok' reliability
2. Go to [zeus.ci](https://zeus.ci) and login via GitHub
3. Navigate to Settings > Repositories to enable a repository
4. On the repository page, go to Settings > Hooks and create a new Travis-based hook
5. Update your ``.travis.yml`` based on the hook information

For more details we've also documented portions of this in the [README on GitHub](https://github.com/getsentry/zeus#zeus).

You can also take a look at Zeus' [Travis configuration](https://github.com/getsentry/zeus/blob/master/.travis.yml) for a real-world example of using it.


## The Future

We want Zeus to become a simple solution for visualizating your change control results on any system, agnostic of where you host your code, what runs your tests, and what languages you write that code in.

That's going to come down to you, the community. We've built Zeus just like we build Sentry: completely open and on GitHub. You'll find all of the source code on the [getsentry/zeus](https://github.com/getsentry/zeus) repository, and can even test drive it in your own infrastructure if you really wanted. While Zeus is more of a pet project of ours than a Sentry offering, it's feature set is something we know is sorely missing from most projects.

If you're looking to help with the project please reach out via the issue tracker, or drop me an email (david at sentry.io). The direction is very open ended, and we're looking for the community to help shape that.
