---
layout: post
title: Protocols for Distributed State
description: overview of consensus
categories:
- post
tags:
- article
- draft
- software
author: Joe Kearney
published: true
js-require:
- http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML
---

{% include image-float.html src='/images/CAP.png' txt_alt='Available choices satisfying the CAP theorem' href='http://book.mixu.net/distsys/abstractions.html' caption='CAP theorem choices<sup>[from <a href="http://book.mixu.net/distsys/abstractions.html">Mixu</a>]</sup>' id='mixu-venn-diagram' side='right' %}

The [CAP theorem](http://en.wikipedia.org/wiki/CAP_theorem) states that among Consistency, Availability and Partition tolerance, only two can be provided simultaneously in any distributed system. This article is intended not so much to debate interpretations of the CAP theorem so much as to give an outline of some approaches that provide different choices of guarantees and interpretations of the CAP conditions.

According to CAP there are basically three options as to which guarantees to lose; however this takes a very hard line on the meanings of the three properties. We'll look at algorithms that choose to forfeit each of these, and ways in which the impact can be lessened.

There are plenty of resources describing this stuff in a lot more detail, including Mixu's much more comprehensive and very readable overview: [Distributed Systems for Fun and Profit](http://book.mixu.net/distsys/index.html). {% comment %} TODO add this-long-run link {% endcomment %}

This article is intended to be a short summary of a few bits, and nothing more.

## What is a distributed system?

We can consider _distrubuted system_ to mean loosely that we have a state machine with copies on multiple machines. The execution of the system is then the sequence of states, and we may want each machine to see the same states or we may allow some divergence. On a larger scale, consider storing data on a number of machines, whether as key-value pairs or a file system, whatever.

The extent to which the different machines see differences in the sequence of states is determined by the choices around consistency, availability and partition tolerance.

Many expositions of these algorithms (at least those that have strong consistency guarantees) describe how to choose a single value in the system. At runtime in a real system you'd expect to run these algorithms many times to progress between states.

These algorithms handle failure of a participant by crashing (allowing that it may restart later), and not necessarily Byzantine (malicious or buggy) failures that may send arbitrary messages. It gets much more complicated to handle this.

## What are these algorithms?

The algorithms discussed here are consensus protocols, which provide a way for a number of nodes to decide on a single value. These algorithms are often described in their _single-decree_ form, but in the real world we need to decide on more than one value. Sometimes the extension to deciding a sequence of events (consider a log of multiple transactions, or a counter that receives a stream of increments) is straightforward, sometimes not.

{% include todo.html note='look at Paxos Made Live' %}

***

# CA -- sacrificing partition tolerance

See [Two-phase Commit](/posts/two-phase-commit).

### See also

* Tree-based 2PC for reducing the workload of the coordinator at the expense of more message-passing delays up the tree of participants

***

# CP -- sacrificing availability

In general, the class of CP algorithms sacrifice availability in some portion of the network -- the distributed service as a whole may remain available when some of its nodes are not. For instance, if a minority of nodes gets partitioned off, the majority may be able to proceed as normal but since no updates will reach nodes in the minority, any clients connecting to one of these will not see a state consistent with the majority.

This might be fine in practice -- clients connected to a small partitioned segment of the network might see stale data, but none of these algorithms should allow new updates in the minority. Maybe stale data is ok if there's a promise of avoiding a split-brain, where both partitions continue with unrelated updates. Similarly there may be enough information in the clients or servers of the minority partition to figure out what's happening and move clients to connect elsewhere.

## Paxos

> Ask for the right to set the \\(n\\)th value. If a majority promise to follow you, then you can assert your value to all others. Otherwise, you're already behind someone else -- try again.

Paxos is a consensus algorithm. It is renowned for being difficult to understand (and I'm not going to embark upon an attempt to rectify that!).

Paxos is usually described in its _single decree_ form, as an algorithm for deciding upon a single value. Clearly in the real world this isn't sufficient, and _multi-Paxos_ is the extension to a sequence of decisions.

> * The _proposer_ **prepares** an update by asking a quorum of _acceptors_ to promise not to accept any proposal numbered less than \\(n\\)
> * The _acceptors_ reply with this **promise** (along with the greatest number proposal for which they've given the same promise) or a `CONFLICT` message indicating that they can't
> * The _proposer_ **requests accept**, asking those _acceptors_ to accept its value `v` numbered \\(n\\)
> * The _acceptors_ **accept** the value unless they've already promised not to. The value `v` is chosen once a quorum accept it

As with 2PC matters are simplified if a single leader is chosen, at least until that leader fails or is partitioned away.

The important piece is the promise by a majority not to accept other values for earlier proposals. In a sense the \\(\left \lceil{n/2}\right \rceil  th\\) promise is the linearisation point of a successful commit.

## Raft

The Raft algorithm was designed specifically to be easier to learn than Paxos while giving the same guarantees.

{% include todo.html %}

***

# AP -- sacrificing consistency

You may not always need strict 'one-copy' consistency, in which all of the state machines have the same state all of the time. It is unlikely that you'll want your system's nodes to become arbitrarily different, but it may be OK to weaken the consistency requirement. It might even be that you can never guarantee that two nodes of your system are in the same state at any one time, and that might be fine.

It boils down to being able to handle updates being processed out of order. This typically requires some means of conflict resolution (specify some domain-specific rules about how to process the updates, or use time to synchronize) or arranging that updates will never conflict (make operations commutative, associative, idempotent). Updates might need to be constrained to being causally ordered, but that's usually fine too.

{% include todo.html note='expand' %}

There are a few versions of this:

* eventual consistency -- requiring that for each node, any update is eventually visible
* quiescent consistency -- if you stop updating the state, eventually all nodes converge to the same state

## CRDTs

Enter **C**onflict-free **R**eplicated **D**ata **T**ypes, built on the idea that if you can describe the operations on your state machine to be commutative, associative and idempotent then each node just dumps whatever operation it performs into the rest of the network.

You'll see CRDTs described in two flavours, both of which can be called conflict-free. The **C** can stand for

* **commutative** -- the operations one. Nodes send messages describing commutative operations to be performed (for a counter consider addition, with messages like "add three", plus a way of ensuring idempotency).
* **convergent** -- the state one. Nodes send messages describing the new state, and the state machine has a known way of merging it in (think: "I'm up to five" for each node, with \\(\max(\cdot, \cdot)\\) as the commutative, associative and idempotent merge operation). The states converge to a common value.

{% include todo.html note='link to David Brooks scalax talk' %}
{% include todo.html note='give examples of basic structures' %}

## Dynamo and Cassandra

Dynamo and Cassandra are the Amazon and Facebook (respectively) implementations of an AP key-value data store. They have many similarities and some important differences. The following is based on the exposition given in the papers published to describe them, and not any more recent changes.

**Dynamo** is the NRW one -- per instance you configure the number \\(N\\) of desired replicas of the data, the number \\(R\\) of readers required per query

{% comment %}See Slide 58 on http://www.slideshare.net/aszegedi/everything-i-ever-learned-about-jvm-performance-tuning-twitter about Cassandra slab allocator, special GC enabled by every write being sequential{% endcomment %}
