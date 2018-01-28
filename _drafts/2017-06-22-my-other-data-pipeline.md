---
layout: post
title: "My Other Data Pipeline"
description: "never let a cyclist write code"
long_description: "Getting my exercise bike to speak to my laptop took five IO steps, four different serial protocols, three types of radio and a Raspberry Pi"
categories:
- post
tags:
- article
- cycling
- draft
keywords:
- cycling
- kettler
- ant
status: published
type: post
author: Joe Kearney
title_image_float_right_url: /images/dot/img/kettler-pipeline.png
---

[haute-route]: /posts/haute-route-intro
[dataset-ownerhip]: /posts/dataset-ownership

By day I work with [petabytes of data][dataset-ownerhip] and a message throughput of six figures per second. By night I [ride a bike indoors][haute-route]. Unfortunately, mMy choice of indoor bike was not a good one for getting the data somewhere useful!

## Ant+

The most widely-used protocol for transmitting from sensors used in sport, at least in cycling, is **Ant+**. Heart rate monitoring straps, speed and cadence sensors, power meters commonly send data over Ant+ to be read by a _head unit_, which might be your running watch or bike computer. Browsing the Ant+ website documentation reveals an impressively comprehensive array of types of equipment for which a monitoring protocol exists. Did you know you can row and deliver stroke rate data over Ant+? Or monitor your blood-oxygen if you have the right bit of kit?

There is also a standard set of Bluetooth protocols that some devices use. I have a Garmin head unit that doesn't support this, so that wouldn't be helpful alone.

The hope was that my new indoor bike would talk Ant+ so that the usual kit could monitor it. That would let me use Zwift, Golden Cheetah and friends to keep track of my exercise.

When my shiny new Kettler Racer 9 arrived it took both my wife and I to carry it up the stairs to the flat, weighing something like 80kg. The flywheel alone weighs more than double my real bike.

I discovered pretty quickly that it doesn't emit Ant+ itself. It does come with a USB port, and it does talk over Bluetooth, if you know what it's saying (hint: it's not the normal cycling sensor Bluetooth!).  
