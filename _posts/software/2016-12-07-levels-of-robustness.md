---
layout: post
title: "Levels of Robustness"
description: "so many things can go wrong"
meta_description: "We like our code to be \"robust\". This post looks at different failure modes against which a system needs to be protected"
categories:
- post
tags:
- article
- software
- draft
status: published
type: post
author: Joe Kearney
---

We engineers like our systems to be robust; we don't want our stuff to break. But what does this mean more precisely, and how can we achieve it?

There are multiples modes of failure of a system once it's running[^1], and robustness against them means different things. Here I want to look at a few of these in increasing order of scope, and at what can be done to protect against them.

## 1. Code and node failure

This is the easy bit, covering general good practice at the level of code and application design.

Handle errors consistently and close your I/O resources properly; write tests for your features and don't test in production; keep the build green. Handling failure of a single server in a distributed system is nowadays a pretty well-understood problem, and the principles of [Twelve Factor][12-factor] apps help by encouraging a style of coding and design that allows problems in parts of your infrastructure (machine crashes) not to cause total failure of your system.

The mitigation here is primarily one of **encouraging best practice in code** and the process around coding, whether through pairing or code review. Much of this point is tied to the maturity of the developers on the team; those who are more senior do this better almost by definition.

## 2. Systemic failure

If straightforward failure of a machine is easy to handle, it's harder to protect against systematic problems that cause changes in behaviour. This may be bad data from a source you don't control, or a bug you introduce yourself. It's even more difficult if the bug is introduced in code owned by another team. Some principles and techniques in the design of the system can help introduce resiliency against these kinds of problems.

In some cases it is possible to introduce some process to make certain failure modes impossible, or at least ensure that they occur with lower probability, are bounded in time or recover automatically.

### Redundancy in computation

Suppose you have a flow of events and a decision to take some action based on information about the event. A whole class of timing errors, or even short-term outages of dependencies, can be dealt with by **re-running this computation on a delay**, perhaps triggered in a different way. Just process everything again after some period.

If the re-runs respond differently to the first runs, then it's likely there was a problem -- whether there was a change in state or behaviour or even the event source. Doing this may provide an upper bound on the time for which your service was broken, and might allow some more time to figure out what's gone wrong. It might even allow for the problem to heal itself.

For a concrete example, imagine a system that takes state from elsewhere. Late updates to that state may lead to bad output until the updates have arrived. A schedule of duplicating computation allows late updates to be handled gracefully.

### Redundancy in data

Suppose your system uses data provided from some other source, and when the source becomes unavailable then your service can't work. It may be that it's possible to build in robustness against their failure by a simple layer of caching, even to the extreme where you **cache all of the data** that you get from upstream.

A previous project of mine copied all data from its dependencies in batch on a regular schedule, making it effectively immune to outages in other parts of the company. The data might be a few hours stale but at least we had total control over access. This sort of scheme could be improved as a Lambda-type architecture, adding a streaming input on top of the batch layer -- in the best case you have live data, in the worst case it's stale, and the system is unaffected by problems upstream.

***

In both of these cases there are costs, as well as benefits. In the first your computation load is doubled, in the second you need the space to store everything again. In general the idea is to **implement process that makes failure impossible**, or at least less bad. Of course this is another cost/benefit tradeoff to consider.

## 3. Organisational change

People move between teams; teams move around organisations; systems change ownership. We should build with an expectation of this. This may mean little at the level of writing code, but should be a big input into choices at a wider level.

### Consistency

One pressure might be towards consistency across an organisation. More consistency in languages, libraries and patterns gives developers a common vocabulary and allows shared code and shared experiences. It's easier to learn from other teams when there are similarities in how you build software.

The important opposing pressure is for a project to use the technologies that suit locally, whether for the task at hand or based on knowledge and experience of the current team. Clearly this is important, allowing fast delivery of features.

The balance to be struck is between specificity of a tool for the project at hand and a wider preference for consistency across projects where possible. I would argue, indeed, that **consistency should be the default** and local differences should be justified; not the reverse.

### Ownership

Ownership takes many forms.

Inside a team, all too often ownership of a feature becomes conflated with authorship of the code, leading to silos of knowledge. Fixing this might be more of a project management issue than a technical one, but has profound impact on engineering quality.

Looking more broadly this means ensuring that ownership of systems, features, datasets or infrastructure are in the right place and, where it's not, moving things around (see above). We see problems where the purported owner doesn't have the context to act -- you wouldn't expect the plumber to fix an electricity problem. We also see cases where a team takes on more than they should -- you wouldn't expect the plumber to be in charge of getting water to the house.

Defining interfaces carefully and enforcing strong boundaries between systems reduces the risk of problems crossing organisational boundaries. In practice this means nothing more that plain-old encapsulation of your state. Prefer to provide access through a service rather than directly to your database. Don't let your implementation details leak through interfaces.

***

Lack of robustness can often come as the result of accidentally doing something for a local optimisation instead of a global one. Much of the mitigation against that is an aim towards consistency, from standards of writing software to the processes by which decisions are made at these much wider scales. Define your standards and processes, define the acceptable cases for divergence from them, and the balance can be found between local and global.

***

[^1]: I'm not referring to failure of a team to deliver a project; this is a hard problem in itself, but a different one to the technical challenges.

[12-factor]: https://12factor.net/
