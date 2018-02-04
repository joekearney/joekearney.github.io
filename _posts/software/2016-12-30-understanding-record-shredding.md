---
layout: post
title: "Understanding Record Shredding"
description: "storing nested data in columns"
long_description: "Record shredding allows nested data structures to be considered in a sort-of-tabular way, and stored in a columnar data store. This post describes the intuition behind how this can be done preserving message structure, from Dremel and Parquet."
categories:
- post
tags:
- article
- software
- highlight
status: published
type: post
author: Joe Kearney
---

Starting with a ton of [protobuf][protobuf] messages, I was interested in querying over them using Hive and Parquet. Parquet describes a columnar storage format for data that is not necessarily tabular, for example with nested message schemas. Columnar storage can be a good choice when queries don't read all columns of the data. How can you store these nested messages in columns, preserving the structure?

The original work for this came from Google. The [Dremel paper][dremel-paper], published in 2010, describes the storage format and query engine that became the basis for Parquet.

This post is a view over the detail, not what you'd actually need to run it. This is based heavily on the [Twitter blog post][twitter-parquet] describing the same, and is only an attempt to describe the process for my own understanding. This isn't intended to be enough to reproduce the full detail, but should be a start at getting an intuition about the approach.

## Intuition and running example

<div class="inline-image-right">
{% highlight proto %}
message AddressBook {
  required string owner;
  repeated string ownerPhoneNumbers;
  repeated group contacts {
    required string name;
    optional string phoneNumber;
  }
}
{% endhighlight %}
</div>

The term **record shredding**, or **striping**, comes from the idea that we're taking apart the records from their per-message encoding. We lose locality per message in favour of locality per field.

The principle intuition is to think of the message format as a tree, rooted at the message type with child nodes for each component.

* leaf nodes are primitive types -- actual data to store
* non-leaf nodes are types containing other data

Note that each of these may be `NULL` if the node (or any parent) is optional or repeated. Each node in the tree has a **path** through the tree with a segment per node on the path, for example `AddressBook.contacts.phoneNumber`

With some repeated elements, a **path might refer to multiple fields** within a single message -- in these examples, multiple phone numbers stored in the address book, or multiple forward links from a document.

The **unit of columnar storage is these paths**. The data stored for each such path is the projection of a message onto this path -- it may be `NULL` depending on optionality of nodes above it.

Given that fields may be optional or repeated we need to **store some additional information** to preserve the structure, specifically two extra integer values.

{% include clearfix.html %}

## Preserving structure

We store two pieces of extra information for each value at each path. These allow the original messages to be reconstructed completely from these partial projections.

* **definition level** that describes how many optional elements are undefined
* **repetition level** that describes the structure of repeated elements

### Definition Levels

{% include image-float.html src='/images/record-shredding/definition-levels-diagram.png' txt_alt='Illustration of definition levels in a simple example' caption='from the <a href="https://blog.twitter.com/2013/dremel-made-simple-with-parquet">Twitter post</a>' id='definition-levels-diagram-image' side='right' background-colour='white' %}

> How many fields in [path] _p_ that could be undefined (because they are optional or repeated) are actually present in the record?
>
> <p class="cite">&mdash; definition from <a href="https://research.google.com/pubs/pub36632.html">the paper</a>, sec 4.1</p>

The **definition level** of a value at a path handles elements that might be `NULL`. It means "**how much of the path to the node is defined?**".

For leaves under a node that can be missing (because it's optional or repeated), the leaf can be undefined _from a certain level_. The leaf may be undefined, or its parent, or some other node further up the tree. The definition level records which segment along the path is the first to be undefined.

As an optimisation, required nodes don't need to count towards the definition level, so for counting segments of the path, required nodes are ignored.

{% include clearfix.html %}

### Repetition Levels

{% include image-float.html src='/images/record-shredding/repetition-levels-diagram.png' txt_alt='Illustration of repetition levels in an AddressBook example' caption='from the <a href="https://blog.twitter.com/2013/dremel-made-simple-with-parquet">Twitter post</a>' id='repetition-levels-diagram-image' side='right' background-colour='white' %}

> It tells us at what repeated field in the field's path the value has repeated
>
> <p class="cite">&mdash; definition from <a href="https://research.google.com/pubs/pub36632.html">the paper</a>, sec 4.1</p>

The **repetition level** handles repeated elements. This is best viewed from the point of view of re-assembling the records from the columnar store into the original message.

A repeated element means we're dealing with lists of subtrees rooted at that node. When reconstructing the message, a value of _n_ for the repetition level means "**start a new list of repeated elements at level _n_ in the tree**"

{% include clearfix.html %}

## Storage and re-assembly

In this format, a path in a message is stored simply as the series of values at that path with their extra fields.

Given that a single message may have many values at one path, many records may be stored per column for that path. Reading from this stored format takes the form of reading through the separate columns in a coordinated way, something like having a cursor in the file for each path.

A finite state machine can be constructed for a query, based on the columns that it reads, in which states describe which path from which to consume a value. Transitions are given by the repetition levels, and once you transition back to the root state, you've read a complete message.

> An FSM state corresponds to a field reader for each selected field. _[...]_ we look at the next repetition level to decide what next reader to use. The FSM is traversed _[...]_ once for each record.
>
> <p class="cite">&mdash; definition from <a href="https://research.google.com/pubs/pub36632.html">the paper</a>, sec 4.3</p>

## Sources, resources

* The Google [Dremel paper][dremel-paper]
* Twitter [blog post][twitter-parquet] describing record shredding in Parquet
* Parquet [wiki page][parquet-wiki]

[dremel-paper]: https://research.google.com/pubs/pub36632.html
[twitter-parquet]: https://blog.twitter.com/2013/dremel-made-simple-with-parquet
[protobuf]: https://developers.google.com/protocol-buffers/
[parquet-wiki]: https://github.com/Parquet/parquet-mr/wiki/The-striping-and-assembly-algorithms-from-the-Dremel-paper
