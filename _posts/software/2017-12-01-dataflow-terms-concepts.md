---
layout: post
title: "Concepts in DataFlow"
description: "basic definitions"
meta_description: "Google's 2015 paper on the Dataflow model describes general solutions to general data pipeline processing problems. The terms they use have been helpful to me in understanding patterns in these problems."
categories:
- post
tags:
- article
- software
- comments
status: published
type: post
author: Joe Kearney
source: https://research.google.com/pubs/pub43864.html
---

[Li 2005]: http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.93.2764&rep=rep1&type=pdf
[Cloud Dataflow]: https://cloud.google.com/dataflow/
[dataflow-paper]: https://research.google.com/pubs/pub43864.html
[Apache Beam]: https://beam.apache.org/

Google [published a paper][dataflow-paper] in 2015 describing a general model of data pipeline computation, discussing how to balance correctness, latency, cost, scale, boundedness (or otherwise) and ordering (or lack thereof!).

This was the foundation of an internal implementation that eventually surfaced as the [Apache Beam] APIs, and a commercially-available implementation in Google [Cloud Dataflow].

I've found the concepts introduced in the paper as a great foundation for thinking about these kinds of problems. Separating the ideas of event-time and processing-time, and thinking explicitly about triggers for processing of late events, has been very instructive. Here I want to summarise some of these concepts.

## Time

**Event-time** is the time at which an event actually occurred. This is a record of the time that the event occurred according to whatever system generated the event.

**Processing-time** is the time at which an event is observed during processing. There might be many such processing times, as data is processed at stages through a pipeline.

A **watermark** is the lower bound on event-times that have been processed. It can be interpreted as "we've received all events prior to this time". When events can be received with arbitrary delay this obviously cannot be true, and in practice it is often heuristically established.

The intuition is that the processing-time is later than the event-time, and that the watermark is far enough in the past that we expect no (or at least few) events further back in the past.

## Windowing

A **window** determines where _in event-time_ data are grouped for processing. It's a finite chunk of a dataset over which to run some processing (see [Li 2005] for more here).

There are a few different kinds of windows that come up commonly.

* **fixed** -- defined by duration, for example by hour. Windows are consecutive and don't overlap.
* **sliding** -- defined by size and period, for example hourly starting every minute. If the period is less than the size then windows overlap. If the period and size are equal then this looks like fixed windowing.
* **sessions** -- defined by a key, often with a timeout attached. For example, a session starts with the first observation of a user, and a session continues until no further events have been seen for a while.

Windows are called **unaligned** if a single window doesn't span the entirety of a data source. Session windows per user, for example, don't include the whole data space for its event-time range.

## Triggering

A **trigger** determines where _in processing-time_ the results of processing over a window are emitted. A trigger stimulates the output of processing of a specific window of event-time.

When events arrive late, and further processing happens after an earlier batch was processed, how do the new results relate to the last ones? There are different approaches.

* **discard** -- each time processing is triggered, only the new events are processed. Results that were previously emitted are unchanged. This is useful when downstream consumers expect these result sets to be independent. For a simple example, consider a consumer that expects only counts of events. Each trigger passes a single independently valid value, and they can be added together.
* **accumulate** -- each trigger uses the full window, old data is processed again within the window. This is useful when a consumer expects new results to overwrite old results.
* **accumulate/retract** -- each trigger causes reprocessing of the full window. The new results are published alongside the old ones, with a retraction of those previous results. This might mean emitting negation of current information.
