---
layout: post
title: "Off-Platform Validation"
description: "automatic checks with supervision"
long_description: "SoundCloud Premier Distribution allows creators to distribute their music from SoundCloud to other streaming platforms and stores. For many of our users, this will be their first experience with the strict requirements of the music industry supply chain on metadata and media. Here we’ll look at how a system of automatic and manual validations allows users to get fast feedback as they prepare a release."
categories:
- post
tags:
- article
- software
- nocomments
- highlight
status: published
type: post
author:
- Joe Kearney
source: https://developers.soundcloud.com/blog/off-platform-validation
---

<div class="bs-callout bs-callout-danger"><p>This post first appeared on the <a href="{{page.source}}">SoundCloud Developers Backstage blog</a>.</p></div>

Last month we launched [SoundCloud Premier Distribution](https://creators.soundcloud.com/premier), which allows creators to distribute their music from SoundCloud to many other streaming platforms and stores. The result? Artists can now get paid for plays on other platforms just like they can on SoundCloud.

For many of our users, this will be their first experience with the conventions and requirements of the music industry supply chain. The barriers to entry to this world are very different than those to a creator uploading to SoundCloud. At SoundCloud, we’re proud of how easy it is and how few clicks it takes to publish your work. In contrast, the process of getting your content onto Spotify, iTunes, or any of the other platforms fed by distributors has many more strict requirements regarding metadata and media.

The aim of SoundCloud Premier Distribution is to make the path from SoundCloud upload to off-platform plays as frictionless as possible. Here we’ll look at how a system of automatic and manual validations allows users to get fast feedback as they prepare a release.

## What Are These Extra Requirements?

To upload to SoundCloud, the minimum metadata required is the track title, and even that gets auto-completed based on the name of the file you upload. Easy. There’s a maximum length restriction, but that’s about all.

To send content to other platforms, the title has many more strict requirements, as do other fields. There are syntactic, structural, and semantic rules that have to be observed. Some examples of these are:

* The metadata has a fixed character set that, in particular, does not include emojis. 😢
* Words in the title should be capitalized, with the exception of a list of short prepositions.
* Some words — such as references to physical formats or other streaming platforms — are not allowed.
* The artist or label name shouldn’t go in the title, as there are other fields for that.
* You shouldn’t specify in the title that it is a live recording or a remastering — there’s another field for that.
* The audio format has minimum quality requirements, as does the artwork image format.
* The title in the album artwork has to match the title.

There are so many rules and style guides with frightening levels of detail about what will pass quality control for the various streaming services.

Many of these rules are **difficult to automate completely**. We can’t just block the word “live” in the title, because while “My Hit Song (Live Version)” isn’t allowed, “Live and Let Live” is fine.

Not only are the rules difficult to navigate, but they are also **spread out in time**. While we can check some rules in real time whenever a user makes a change on soundcloud.com, some take too long to run every time, or they require manual input from our QC team. These checks have to happen asynchronously, with results shown to the user later.

What’s worse is we can also receive validation failures from streaming services much later — in some cases, even after a track has been live for a while.

All that said, how do we help the user through this maze of rules that can fail immediately or even weeks later?

## Automatic Checks with Supervision

We’ve built a system of validation rules that can be applied to all of the different fields of metadata. This system checks that data is present and follows the rules, and it reports errors to users. Some rules are easy and can be entirely automatic — for example, image dimensions. Some are almost impossible to check automatically — for example whether or not a track is explicit. And some would be expensive to automate and hard to make correct — for example, genre checking or parsing text from an image. Whenever a change is made to the metadata of a track or a release, it needs to be checked before the update is shipped off-platform.

So we’ve settled on a mixture of rules that can be applied automatically, those that require human eyes, and those that can defer to a human if there’s doubt. Everything can be overridden manually later.

The thing is, we need to cope with a lot of volume, and we only have a finite number of humans checking these releases. And while computer time is cheap, theirs is precious.

As such, there are two lifecycles here that we can model separately:

* **Fast automatic feedback** — We want to know whether each product is valid each time we look at it, and so we run the validations every time a user looks at a page. This is fine for simple validations about the presence of data or many of the rules about text fields.
* **Asynchronous feedback** — There are expensive validations (e.g. manual) that we want to run at most once for each value of the content (whether text, audio, or image), and not repeatedly if it doesn’t change.

Consider that a release might change over time as more metadata is added or changed. Each time there’s a change, the fields that were edited should be checked by the QC team, but the team shouldn’t have to, for example, approve the same artwork every time. Unless the image changes, we should store the pass/fail result and use that whenever we want to check the validity of the release. We call that stored pass/fail result **evidence** for the validity of the release.

To understand these two lifecycles, we can think of a validation result as being the output and having evidence for the validity of the content as an input. When we check a release, we look for indications that the value satisfies the validation rule — either as stored evidence applicable to that value, or by actually checking the content.

This distinction between slow and fast and synchronous and asynchronous implementations of validation rules has allowed us to run them a lot — every time the user looks at the page, every time we build the rendering of a release that we send to a partner, and every time the release is shown in the QC process. This means that the results are both fast and as up-to-date as possible.

## Simple Patterns

Caching values so they don’t have to be recomputed is not a novel idea. Here we’re treating evidence of validity as a cached result of a validation rule. This has allowed us to model changes to data and the various stages of quality control in a way that combines these very different lifecycles. As a result, we can give fast and consistent feedback to users distributing their content, all without overwhelming our QC team.
