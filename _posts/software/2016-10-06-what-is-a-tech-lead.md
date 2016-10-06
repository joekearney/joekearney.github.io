---
layout: post
title: "What is a Tech Lead"
description: "or, how I think of my job"
meta_description: "I recently became a tech lead, and this describes what I think that means"
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

It's well documented that the process of moving teams internally is well supported at [SoundCloud][soundcloud]. I recently moved teams to became a tech lead, and I want to describe here what I think that means in terms of my work and the things that we build together. The process for this move included an interview in which I was to describe how I would interpret the role, and this post is something of a distillation from that.

## History

The tech lead role came about here a couple of years ago and, as I see it, continues to be refined. In the loosest possible description, at SoundCloud engineering we work in teams of a product owner **prioritises and decides what** we should build, an engineering manager who **organises the resources** of the team by assigning work, hiring and supporting personal development, and a few engineers **write the code** and keep our systems running. The organisation is set up to allow decisions to be made locally within teams where possible -- this means that teams can progress with minimal coordination (_"move fast"_) but can allow technical choices made in separate teams to diverge (_"break things"_).

The tech lead role was established to tie teams back together. A tech lead works across around two to four related engineering teams, to help keep some consistency around engineering approach across the company and to keep an eye on the longer-term architecture of our systems. There are now around ten tech leads across the company, and with the [recent reorganisation][ele-medium] of our data platform I'm excited to be the newest of them.

It's worth noting that the specifics of the role vary by area. So my description here is coloured by how I interpret the role for the Data Platform. This is a group that provides infrastructure to other teams within the company, specifically engineers and data scientists. Interfaces with other internal engineers obviously represent a different set of challenges and tradeoffs to, say, providing features to external users.

What is this role not?

* Grand arbiter of all technical decisions for the team
* Line manager, people manager
* The "best" engineer on the team

<div class="bs-callout bs-callout-danger">
  <span class="heading">TL;DR:</span>
  A lot of the role of a tech lead boils down to questions of process: "find a process that <b>makes it impossible</b> to break our stuff"
</div>

I see the role as a combination of a few areas: **architecture**, **robustness** at multiple levels, and **representation** of the team and of the wider organisation. And I think a lot of values in this are tied together by the following observation:

{% capture tradeoffs %}
### Observation: everything is a tradeoff; be explicit about them

It's very rare in software engineering that we get to make absolute choices.
Every decision to build something one way means losing the benefits of another approach, and there are costs and opportunity costs at every step. The evaluation of these choices often varies over time, as requirements, priorities, technology and even staff change. Worse, the costs involved may not only be borne by your team but also by your customers, now or in the future.

These tradeoffs typically manifest as choices to be made on cost.

* a quick solution now that adds technical debt will require cleaning up later, while "doing it properly" may take longer up-front but cause less maintenance cost and require less developer brainpower to work with it later
* using a technology that is already familiar to you and your team might allow faster delivery of a feature, but could make it harder to be used by another team, whereas using technology and patterns that are consistent with other parts of the company may take longer but can reduce that cost for others.
* a choice of a technology now may make it harder to move to something else later; a given design choice now may lead to scaling or maintenance costs in the future or make it harder to migrate when the next change happens

That we deal in tradeoffs should be neither a groundbreaking nor surprising observation, but **making them explicit** allows at least a sensible discussion of the problems. In discussions on approaches to solving a technical problem the role of a tech lead is to provide this clarity, so that the judgement on prioritisation can be made with some understanding of the future consequences.
{% endcapture %}
{% include sidebar.html content=tradeoffs %}

## Architecture

The longer-term view of wider system.

This is the part performed in some organisation by titles such as _lead engineer_ and _software architect_.

## Robustness, at all levels

We engineers like our systems to be robust; we don't want our stuff to break, but what does this mean more precisely? There multiples modes of failure of a system once it's running[^1], and robustness against them means different things.

### 1. protect against code and node failure

This is the easy bit, covering general good practice at the level of code and software process.

Handle errors consistently and close your I/O resources properly; write tests for your features and don't test in production; keep the build green. Handling failure of a single server is nowadays a pretty well-understood problem, and the principles of [Twelve Factor][12-factor] apps help by encouraging a style of coding and design that allows problems in parts of your infrastructure not to cause total failure of _your_ system.

The tech lead's role here is primarily one of **encouraging best practice in code** and the process around coding, whether through pairing or code review. Much of this point is tied to the maturity of the developers on the team; those are are more senior do this better almost by definition.

### 2. protect against systemic failure

If straightforward failure of a machine is easy to handle, it's harder to protect against the introduction of a bug that causes changes in behaviour. It's even more difficult if the bug is introduced in code owned by another team. There are some techniques that can help make a system resilient to these kinds of problem.

There are one or two general principles that can help here, such as making your operations idempotent so that responding to duplicate requests doesn't cause inconsistency. In some cases it is possible to introduce some process to make certain failure modes impossible, or at least ensure that they occur with lower probability.

Suppose you have a flow of events and a decision to take some action based on information about the event. A whole class of timing errors, or even short-term outages of dependencies, can be dealt with by rerunning this decision on a delay, perhaps triggered in a different way. If the reruns respond differently to the first runs, then it's likely there was a problem -- whether there was a change in state or behaviour or even the event source. Doing this may provide an upper bound on the time for which your service was broken, and might allow some more time to figure out what's gone wrong.

I've found it difficult to codify or formalise these techniques beyond examples, but in general the idea of setting up process that make it impossible to things to fail in
This is an example of

### 3. allow for organisational change

## Representation

The tech lead can also be something of an ambassadorial role.

* representing the team

***

[^1]: I'm not referring to failure of a team to deliver a project; this is a hard problem in itself, but delivery of features is not a part of the responsibility of a tech lead in our model. That part of project management falls to either the engineering manager or the project manager.

[soundcloud]: https://soundcloud.com
[ele-medium]: https://medium.com/@_eleftherios/https-medium-com-eleftherios-above-the-clouds-5-years-of-data-at-soundcloud-part-1-8803e2059fa
[12-factor]: https://12factor.net/
