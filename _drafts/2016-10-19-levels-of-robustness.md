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

We engineers like our systems to be robust; we don't want our stuff to break, but what does this mean more precisely? There multiples modes of failure of a system once it's running[^1], and robustness against them means different things.

## 1. protect against code and node failure

This is the easy bit, covering general good practice at the level of code and software process.

Handle errors consistently and close your I/O resources properly; write tests for your features and don't test in production; keep the build green. Handling failure of a single server is nowadays a pretty well-understood problem, and the principles of [Twelve Factor][12-factor] apps help by encouraging a style of coding and design that allows problems in parts of your infrastructure not to cause total failure of _your_ system.

The tech lead's role here is primarily one of **encouraging best practice in code** and the process around coding, whether through pairing or code review. Much of this point is tied to the maturity of the developers on the team; those are are more senior do this better almost by definition.

## 2. protect against systemic failure

If straightforward failure of a machine is easy to handle, it's harder to protect against the introduction of a bug that causes changes in behaviour. It's even more difficult if the bug is introduced in code owned by another team. There are some techniques that can help make a system resilient to these kinds of problem.

There are one or two general principles that can help here, such as making your operations idempotent so that responding to duplicate requests doesn't cause inconsistency. In some cases it is possible to introduce some process to make certain failure modes impossible, or at least ensure that they occur with lower probability.

* **redundancy in computation** -- suppose you have a flow of events and a decision to take some action based on information about the event. A whole class of timing errors, or even short-term outages of dependencies, can be dealt with by rerunning this decision on a delay, perhaps triggered in a different way. If the reruns respond differently to the first runs, then it's likely there was a problem -- whether there was a change in state or behaviour or even the event source. Doing this may provide an upper bound on the time for which your service was broken, and might allow some more time to figure out what's gone wrong.
* **redundancy in data** -- suppose your system uses data provided from some other source, and if your source becomes unavailable then your service can't work. It may be that it's possible to build in robustness against their failure by a simple layer of caching, even to the extreme where you cache all of the downstream data. A previous project of mine copied all data from a particular dependency internally in batch a few times a day; the data might be a few hours stale but at least we had total control over access.

In both of these cases there are costs, as well as benefits. In the first your computation is doubled, in the second you need the space to store everything again. I've found it difficult to codify or formalise these techniques beyond examples, but I hope it's clear that there is some value here. In general the idea is to **implement process that makes failure impossible**, of course weighing up the costs of doing so against the benefit.

## 3. allow for organisational change

{% include todo.html note="Consistency of approach across teams, share code and tech" %}

[12-factor]: https://12factor.net/
