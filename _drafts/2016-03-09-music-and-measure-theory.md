---
layout: post
title: "Music and Measure Theory"
description: "harmonious rationals"
long_description: "A write-up of an excellent video by 3blue1brown describing a beautiful correspondence between tuning musical intervals and the measure of the rational numbers."
categories:
- post
tags:
- article
- software
- draft
- comments
keywords:
- music
- maths
published: false
type: post
author: Joe Kearney
title_image_iframe: https://www.youtube.com/embed/cyW5z-M2yzw
source: http://www.3blue1brown.com/
js-require:
- http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML
---

Two challenges:

1. **How close to being in tune do two notes have to be** in order for them to _sound_ in tune? What ratios of notes make a pleasant-sounding interval?
1. Can you **cover all of the rationals with small intervals**, so that the sum of the lengths is strictly \\(<1\\)?

## 1. Tuning up

How can you tell whether two notes played together are in tune? No, don't bother, there are [many](https://en.wikipedia.org/wiki/Well_temperament) [different](https://en.wikipedia.org/wiki/Equal_temperament) [ways](https://en.wikipedia.org/wiki/Pythagorean_tuning) to tune instruments and mostly they don't quite align with the harmonics. No matter.

Given any two notes, how can we decide if they sound good together? What does it mean for them to be in tune?

To answer this let's think mathematically about what it means to play two notes together. Take a note of a certain frequency \\(f\\), and consider a note within an octave above \\(f\\). Since an octave doubles the frequency, the second note has frequency \\(r \cdot f\\) for \\(r \in (1, 2)\\). For what values of \\(r\\) do these two notes sound good together? Some standard "good" intervals include a perfect fifth, \\(r = 3/2 \\) and a perfect fourth, \\(r = 4/3 \\). The usual suspect for a cacophonous interval is the tritone, or augmented fourth, with \\(r = \sqrt{2}\\). This might suggest that rational numbers could be a source of "good" intervals.

There's also a physical intuition for this. Sound is just oscillation of air, with pressure peaking at a given frequency. The ratio between the two notes describes the number of cycles of each note between when they peaks line up.

|||| |||| ||||
||| ||| |||


## 2. Measuring the rationals

The rationals numbers, called $$\mathbb{Q}$$, are all of the fractions -- numbers of the form \\(p/q\\) for integers \\(p\\) and \\(q\\). The real numbers $$\mathbb{R}$$ are everything else that's not a fraction.

The rationals are _dense_ in the reals, which means that for any real number that you pick, I can find a rational number that's as close to it as you like. It means they're everywhere, and you can visualise it sort of like a fine mesh on a number line.

## Connections

> The fact that these ideas are connected was simply too beautiful not to share.
>
> <p class="cite">&mdash; Grant Sanderson</p>
