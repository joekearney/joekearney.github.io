---
layout: post
title: "Understanding Record Shredding"
description: "storing nested data in columns"
meta_description: "Record shredding allows nested data structures to be considered in a sort-of-tabular way, and stored in a columnar data store. This post describes the intuition behind how this can be done preserving message structure, from Dremel and Parquet."
categories:
- post
tags:
- article
- software
- draft
status: published
type: post
author: Joe Kearney

source:
- https://research.google.com/pubs/pub36632.html
- https://blog.twitter.com/2013/dremel-made-simple-with-parquet
---

Given a ton of [protobuf][protobuf] messages stored in HDFS I was interested in moving towards Hive and Parquet. Parquet describes a columnar storage format for data that is not necessarily tabular, for example with nested message schemas. Columnar storage can be a good choice when queries don't read all columns of the data. How can you store these nested messages in columns, preserving the structure?

The original work for this came from Google. The original [Dremel paper][dremel-paper], published by Google in 2010, describes the storage format and query engine that became the basis for Parquet.

The term **record shredding**, or **striping**, comes from the idea that we're taking apart the records from their per-message encoding. We lose locality per message in favour of locality per field.

## Intuition and running examples

<div class="inline-image-right">
{% highlight java %}
message AddressBook {
  required string owner;
  repeated string ownerPhoneNumbers;
  repeated group contacts {
    required string name;
    optional string phoneNumber; }}

message Document {
  required int64 DocId;
  optional group Links {
    repeated int64 Backward;
    repeated int64 Forward; }
  repeated group Name {
    repeated group Language {
      required string Code;
      optional string Country; }
    optional string Url; }}
{% endhighlight %}
</div>

The principle intuition is to think of the message format as a tree, rooted at the message type with child nodes for each component.

* leaf nodes are primitive types -- actual data to store
* non-leaf nodes are types containing other data

Note that each of these may be `NULL` if the node is optional or repeated. Each node in the tree has a **path** through the tree with a segment per node on the path, for example

* `AddressBook.contacts.phoneNumber`
* `Document.Links.Forward`

With some repeated elements, a **path might refer to multiple fields** within a single message -- in these examples, multiple phone numbers stored in the address book, or multiple forward links from a document.

The unit of columnar storage is these paths. The data stored for each such path is a representation of all of the data at that path.

Given that fields may be optional or repeated we need to **store some additional information** to preserve the structure, specifically two extra integer values.

{% include clearfix.html %}

## Extra information

We store two pieces of extra information for each value at each path.

### Definition Levels

The definition in the paper is:

> How many fields in _p_ that cound be undefined (because they are optional or repeated) are actually present in the record?

The **definition level** of a value at a path handles elements that might be `NULL`. It means "how much of the path to the node is defined?".

For leaves under a node that can be missing (because it's optional or repeated), the leaf can be undefined _from a certain level_. The leaf may be undefined, or its parent, or some other node further up the tree. The definition level records which segment along the path is the first to be undefined.

As an optimisation, required nodes don't need to count towards the definition level, so for counting segments of the path, required nodes are ignored.

### Repetition Levels

{% include image-float.html src='/images/record-shredding/repetition-levels-diagram.png' txt_alt='Illustration of repetition levels in an AddressBook example' caption='from the Twitter post' id='repetition-levels-diagram-image' side='right' background-colour='white' %}

The definition in the paper is:

> It tells us at what repeated field in the field's path the value has repeated

The **repetition level** handles repeated elements. This is best viewed from the point of view of re-assembling the records from the columnar store into the original message.

A repeated element means we're dealing with lists of subtrees rooted at that node. When reconstructing the message, a value of _n_ for the repetition level means **start a new list of repeated elements at level _n_ in the tree**

{% include clearfix.html %}

## Assembly

***

## Resources

* The Google [Dremel paper][dremel-paper]
* Twitter [blog post][twitter-parquet] describing record shredding in Parquet

[dremel-paper]: https://research.google.com/pubs/pub36632.html
[twitter-parquet]: https://blog.twitter.com/2013/dremel-made-simple-with-parquet
[protobuf]: https://developers.google.com/protocol-buffers/
