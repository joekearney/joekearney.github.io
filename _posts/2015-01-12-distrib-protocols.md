---
layout: post
title: Protocols for Distributed State
description: overview of consensus
categories:
- article
tags:
- interesting
- draft
- software
author: Joe Kearney
js-require:
- http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML
- /js/up.js
---

<div class="inline-image inline-image-right">
  <img src="/images/CAP.png" alt="Available choices satisfying the CAP theorem" title="CAP theorem choices" />
  <div class="inline-image-cap"><p>CAP theorem choices<sup>[from <a href="http://book.mixu.net/distsys/abstractions.html">Mixu</a>]</sup></p></div>
</div>

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

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> look at Paxos Made Live</div>

***

# CA -- sacrificing partition tolerance

## Two-phase commit

> The proposer of a new value asks all other participants to vote to commit, then announces the decision.

2PC is the granddaddy of distributed system protocols. It's widely used in traditional database clustering implementations. There's a huge body of literature behind it, encompassing the algorithm itself and optimisations and heuristics that make it work well in practice.

Often the proposer is a designated coordinator, and remains so for many transactions. (Think database clustering, where you have a single primary and many secondary replicas.) This is not required to be the case -- multi-resource XA transaction management in principal allows any participant to propse a new value.

### Steps

1. A coordinator sends the new value to all participants who vote on whether to commit
2. The coordinator **waits** for a `yes` vote from each
3. Once it has received all votes, it sends a `commit` command to each, or a `rollback` if there was any `no` or timeout

### Failure handling

* On a `no` vote from any participant, the coordinator rolls back the transaction, and the state is unchanged. (This can lead to obvious liveness problems if multiple proposers are competing for the next value, but it remains safe.)
* Failure of a participant before reply leads to a delay, after which the coordinator times out. It could remove the failed participant from the system and retry.
* Failure of a participant after reply leaves all other participants unaffected and in the new state.
* Failure of the coordinator is bad. Participants will remain in a valid state, that of the previous commit, but something else is required to pick a new coordinator and continue.

### Partial handling of partitions

Partitions in the network always mean that some nodes become stale. However as with all of the limitations discussed here there are heuristics allowing various degrees of tolerance. It's straightforward to add some handling that allows the system to continue in the presence of a partition.

Suppose that a minority of nodes is partitioned from the rest. No proposal from within that minority will be unanimously accepted, so no new values will be agreed; any clients connecting to a node in the minority will see no progress. However the majority can still continue -- note that if the majority of nodes can still communicate with each other then it is safe to reduce the size of the cluster to that majority, ignoring the other nodes for the purposes of voting. (Yes, there's some handwaving happening here around managing that reduction safely.)

#### A Digression on Availability Groups

This section describes a practical use case based on 2PC plus a lot of heuristics. Basic 2PC is buried in there somewhere, underneath a lot of other technology. (<a data-toggle="collapse" href="#ag-collapse">click to embiggen</a>)

{::options parse_block_html="true" /}
<div class="collapse" id="ag-collapse">

**SQL Server Availability Groups** (AG) implement this sort of explicit quorum management, where the _new value_ is a transaction and there's always a distinguished **primary** replica acting as the coordinator and some secondary replicas. All writes go through the primary, which pushes new data out to each secondary replica using 2PC. Secondary replicas are available for read-only access by clients, giving good read availability. (I'll only consider the synchronous replication model here; the asynchronous version allows consistency violations -- you can lose data when the primary fails.)

The interesting feature which allows for some partition tolerance is management of the set of replicas required for a _vote-to-commit_. The system uses a combination of  communication required for commit and extra periodic polling. If a replica fails and the primary notices either through timeout during a transaction commit or failure to respond to a periodic check, the bad node can be evicted from the quorum of nodes required for commit. The system can continue to work with the smaller set of nodes. Indeed, any minority of replicas (not containing the current primary) can be removed in this way and, from the point of view of the primary, life goes on. 

Progress from an external point of view does require some cooperation by clients, because any client connected solely to node on the other side of the partition to the primary will not be able to see new updates. A removed replica will know that it has been separated if it stops receiving the periodic communication, so can reject further communication with clients. If the client is able to connect to a replica in the same partition as the primary then the system is still available, from the clients point of view -- this is the extent to which AGs are tolerant to partitions.

As parts of the system fail, or become partitioned away from the primary, the rest can recalculate the required quorum. If two secondary replicas disappear from a cluster of five, the remaining three can agree that as they are the only ones left, a quorum of two of those is now sufficient to maake progress. In general as long as only a minority of nodes fail between each such recalculation, the system can decrease to only two nodes. Noting that nodes in a minority partition will never become primary, we can gradually fail down to a single primary node, which still keeps running. this does avoid the worst possible mode of failure of a cluster with a leader, which occurs when you get a split brain -- two nodes which both think they're in charge.

Failure of the primary in a system with a dedicated leader requires something else, such as a round of a consensus protocol to elect a new leader. Paxos can be used here in general. In smaller cases that may not required -- you can set up an AG with two SQL Server replicas plus a mutually accessible file share as the third "vote". The two real replicas compete to acquire a lock on a file in the share, and the winner is the new leader. Once the leader is chosen, this cluster will tolerate failure of the file share, the secondary replica or both. In general, once a new leader is chosen it can establish as large a quorum of nodes as possible from the accessible nodes.

In summary, it is possible to extend 2PC to be tolerant to some degree to network partitions. SQL Server clustering and AGs are a centralised solution to this, but only as a side effect of fixing a coordinator. In the presence of network partitions the system is only available to clients in the same partition as the leader. You get very strong consistency, and without partitions clients always see the latest state.

</div>
{::options parse_block_html="false" /}

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

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span></div>

***

# AP -- sacrificing consistency

You may not always need strict 'one-copy' consistency, in which all of the state machines have the same state all of the time. It is unlikely that you'll want your system's nodes to become arbitrarily different, but it may be OK to weaken the consistency requirement. It might even be that you can never guarantee that two nodes of your system are in the same state at any one time, and that might be fine.

It boils down to being able to handle updates being processed out of order. This typically requires some means of conflict resolution (specify some domain-specific rules about how to process the updates, or use time to synchronize) or arranging that updates will never conflict (make operations commutative, associative, idempotent). Updates might need to be constrained to being causally ordered, but that's usually fine too.

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> expand</div>

There are a few versions of this:

* eventual consistency -- requiring that for each node, any update is eventually visible
* quiescent consistency -- if you stop updating the state, eventually all nodes converge to the same state

## CRDTs

Enter **C**onflict-free **R**eplicated **D**ata **T**ypes, built on the idea that if you can describe the operations on your state machine to be commutative, associative and idempotent then each node just dumps whatever operation it performs into the rest of the network.

You'll see CRDTs described in two flavours, both of which can be called conflict-free. The **C** can stand for

* **commutative** -- the operations one. Nodes send messages describing commutative operations to be performed (for a counter consider addition, with messages like "add three", plus a way of ensuring idempotency).
* **convergent** -- the state one. Nodes send messages describing the new state, and the state machine has a known way of merging it in (think: "I'm up to five" for each node, with \\(\max(\cdot, \cdot)\\) as the commutative, associative and idempotent merge operation). The states converge to a common value.

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> link to David Brooks scalax talk</div>
<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> give examples of basic structures</div>

## Dynamo and Cassandra

Dynamo and Cassandra are the Amazon and Facebook (respectively) implementations of an AP key-value data store. They have many similarities and some important differences. The following is based on the exposition given in the papers published to describe them, and not any more recent changes.

**Dynamo** is the NRW one -- per instance you configure the number \\N\\ of desired replicas of the data, the number \\R\\ of readers required per query

{% comment %}See Slide 58 on http://www.slideshare.net/aszegedi/everything-i-ever-learned-about-jvm-performance-tuning-twitter about Cassandra slab allocator, special GC enabled by every write being sequential{% endcomment %}