---
layout: post
title: "Semantics of Data Interfaces"
description: "batch, point or stream"
long_description: "There are different styles of interface that we can define for access to data between systems. ..."
categories:
- post
tags:
- article
- software
- comments
- draft
status: published
type: post
author:
- Joe Kearney
---

[soundcloud-dataset-ownership]: https://developers.soundcloud.com/blog/a-better-model-of-data-ownership

In my previous [post on dataset ownership][soundcloud-dataset-ownership] there was a lot discussion of defining clear interfaces. In particular, an interface for some data shouldn't require a consumer to understand (or re-implement) all of the semantics of implementing the domain.

In this context, what do the semantics of an interface mean, when you want to encapsulate the implementation details and hide them from the consumer?

There are three broad types of data access that I want to cover, and some general pointers towards ways of handling how to expose the data at the right level of abstraction for the consumer.

## Request-response

The simplest way to get some data is to ask for a single point. A request-response API typically exposes a single element of its underlying dataset at a time. You can ask about a certain entity and you'll get the latest value. A query to `http://track-metadata/tracks/123` might give you the metadata for that one track, as it currently stands.

This kind of interface will be fine for many real-time use cases, for example in a system composed of microservices. It won't be good for running operations over the whole dataset, and may not be the best way to query for historical data.

Note that the source of truth is completely abstracted away through an API like this. A consumer can expect that that team owning that tracks API is the team that controls track metadata, but doesn't need to (and can't) make any assumptions about how that's managed internally.

## Event sourcing

Event sourcing is used as a way to communicate changes between components of a system, and sometimes across different systems.

The stream of events is the source of truth for the system. Note that this event stream might be source of data for a request-response API like the tracks one above, 

***

* If the an **event stream**

Ask for a data point when you need it (services)

* Snapshot of full dataset (batch)
* Keep a parallel data structure up to date (event sourcing)
    * details on what the events should show
    * divide into
        * internal events (that you might use to implement your system)
        * external events -- the interface that a consumer uses, abstracting away unnecessary complexity
