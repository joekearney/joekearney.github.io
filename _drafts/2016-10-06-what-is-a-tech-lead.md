---
layout: post
title: "What is a Tech Lead?"
description: "or, how I think of my job"
long_description: "I recently became a tech lead, and this describes what I think that means"
categories:
- post
tags:
- article
- software
- draft
status: published
type: post
author:
- Joe Kearney
---

I recently moved teams within [SoundCloud][soundcloud] to became the tech lead of our data platform. The role of tech lead seems to have different interpretations across software engineering, and I want to describe here what I think this role means in SoundCloud.

The tech lead role came about here a couple of years ago and, as I see it, continues to be refined. At SoundCloud engineering we work in teams of a product owner who **prioritises and decides what** we should build, an engineering manager who **organises the resources** of the team by assigning work, hiring and supporting personal development, and a few engineers **write the code** and keep our systems running. Organising in this way allows decisions to be made locally within teams -- this means that teams can progress with minimal coordination (_"move fast"_) but can allow technical choices made in separate teams to diverge (_"break things"_).

The tech lead role was established to tie teams back together. A tech lead works across around two to four related engineering teams, to guide larger-scale architecture of our systems and help keep some consistency around engineering approach across the company. There are now around ten tech leads across the company, and with a [recent reorganisation][ele-medium] of our data platform I'm excited to be the newest of them.

## So what is it?

The tech lead is responsible for the overall architecture of their area, and for the quality in engineering standards.

I see the role as a combination of a few areas: **architecture**, **robustness** of the system and an understanding of what that means in context, and **representation** of the team and of the wider organisation.

In contrast, the tech lead is not:

* the arbiter of all technical decisions for the team --- we should still be aiming for consensus, and the tech lead's role is not to impose decisions on the other engineers
* a line manager or people manager --- this is part of the engineering manager role, in our model
* the "best" engineer on the team; indeed they shouldn't be on the critical path for much feature development
* the only member of the team who should be thinking about the architecture, robustness and quality of our technology

## Everything is tradeoffs; be explicit about them

[here][everything-is-a-tradeoff]

## Architecture

The whole team should understand the broad architecture of the system, and understand where features fit within that.

This is the part performed in some organisations by titles such as _lead engineer_ and _software architect_.

{% include todo.html %}
* The longer-term view of wider system.
*

- longer term and wider scale decisions, balancing (competing) requirements of teams
- prioritising finding global maximum over local
- interactions -- how does this service interact with others, how should we be doing service interaction generally

## Robustness, at all levels

[here][robustness]

## Representation

The tech lead can also be something of an ambassadorial role:, both representing the team outwards to internal users of our services, and representing the rest of the company inwards to the team.

Representing the team **outwards** to the rest of the company could include advertising tools that are available for use, or communicating changes to services and published APIs. This might include articulating context about why changes we want to make will (eventually) help other teams, or why we chose not to do something in a way that you wanted. The tech lead can also be a point of coordination for wider efforts, changes that affect multiple teams; in the context of the data platform maybe that even means helping to coordinate when no engineering needs to be done in my team.

Representation **inwards** means being an advocate for consistent use of technology across the company and introducing best practice from across the industry. In SoundCloud the collective of tech leads from around the company meets regularly to share and disseminate guidance on common approaches and patterns that come up, working towards consistency in choices. This brings shared experience and a shared vocabulary that can improve shared understanding of the systems across the company and context around the challenges that other groups face, which in turn allows us to work better with users and stakeholders. It's also here that conflict can arise between local views on choices of technology and wider views on whether there should be a consistent approach between teams.

[soundcloud]: https://soundcloud.com
[ele-medium]: https://medium.com/@_eleftherios/https-medium-com-eleftherios-above-the-clouds-5-years-of-data-at-soundcloud-part-1-8803e2059fa

[everything-is-a-tradeoff]: /posts/everything-is-a-tradeoff/
[robustness]: /posts/levels-of-robustness/
