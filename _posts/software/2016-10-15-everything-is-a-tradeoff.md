---
layout: post
title: "Everything Is a Tradeoff"
description: "in praise of writing down design choices"
meta_description: "Being explicit about costs and implications when making choices makes future decisions easier when things change. A collaborative document can be a great implementation of this."
categories:
- post
tags:
- article
- software
status: published
type: post
author: Joe Kearney
---

Maths teachers in my school used to recite "_write down your working_" ad aeternum in an attempt to get us record the path from problem to solution. It took me a long time to realise that this rule generalises to describe a useful practice in software engineering.

It's very rare in software engineering that we get to make absolute choices. Every decision to build something one way means losing the benefits of another approach, and there are costs and opportunity costs at every step.

The evaluation of these choices often varies over time, as requirements, business priorities, technology and even staff change. Worse, the costs involved may not only be borne by your team but also by your customers or other teams/systems with which you interact, now or in the future.

Tradeoffs typically manifest as choices to be made on cost.

* **technical debt** --- a quicker solution now may deliver a feature sooner but require cleaning up later, while doing it "properly" may take longer up-front but cause less maintenance cost and require less developer brainpower to work with it later
* **familiarity** --- using a technology that is already understood by you and your team might again allow faster delivery but could make it harder to be used by another team, whereas using technology and patterns that are consistent with other parts of the company may take longer at the start but can reduce that cost for others.
* **future-proofing** --- a choice of a technology now may make it harder to move to something else later; a given design choice now may lead to scaling or maintenance costs in the future or make it harder to migrate when the next change happens
* **painting the bikeshed** --- blue instead of green means that... no, nevermind.

That we deal in tradeoffs should be neither a groundbreaking nor surprising observation. My claim is that **making the choices and evaluations explicit** allows a sensible discussion and wider understanding of the problems, both at the time and in the future.

Explicit, here, just means writing it down, recording the path from problem to solution. A collaborative document describing the decision to be made or feature to be built, the motivation for the work and the different choices available becomes both a **venue for discussion** around the merits of competing approaches and a **record of choices**, both what we chose to do _and why_ we chose to do it.

Revisiting the problem in the future, having a document like this saves a lot of work to reconstruct the history and context that was understood at the time. It means that you don't have to repeat old debates, until there's new information to discuss.
