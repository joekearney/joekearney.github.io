---
layout: post
title: Protocols for Distributed State
description: an overview of distributed state management
categories:
- work
tags:
- interesting
- draft
author: Joe Kearney
---

<div class="inline-image inline-image-right">
  <img src="/images/CAP.png" alt="Available choices satisfying the CAP theorem" title="CAP theorem choices" />
  <div class="inline-image-cap"><p>CAP theorem choices<sup>[from <a href="http://book.mixu.net/distsys/abstractions.html">Mixu</a>]</sup></p></div>
</div>

The CAP theorem states that among Consistency, Availability and Partition tolerance, only two can be provided simultaneously in any distributed system. This article is intended not so much to debate interpretations of the CAP theorem so much as to give an outline of some approaches that provide different choices of guarantees and interpretations of the CAP conditions.

According to CAP there are basically three options as to which guarantees to lose. We'll look at algorithms that make each of these choices.

There are plenty of resources describing this stuff in a lot more detail, including Mixu's much more comprehensive and very readable overview: [Distributed Systems for Fun and Profit](http://book.mixu.net/distsys/index.html). This article is intended to be a short summary, and nothing more.

# What is a distributed system?

Throughout this, we can consider _distrubuted system_ to mean loosely that we have a state machine with copies on multiple machines. The execution of the system is then the sequence of states, and we may want each machine to see the same states. The extent to which the different machines see differences in the sequence of states is determined by the choices around consistency, availability and partition tolerance.

Many expositions of these algorithms (at least those that have strong consistency guarantees) describe how to choose a single value in the system. At runtime in a real system you'd expect to run these algorithms many times to progress between states.

These algorithms handle failure of a participant by crashing (allowing that it may restart later), and not necessarily Byzantine (malicious or buggy) failures that may send arbitrary messages. It gets much more complicated to handle this.

# CA -- sacrificing partition tolerance

## Two-phase commit

2PC is the granddaddy of distributed system protocols. It's widely used in traditional database clustering implementations. There's a huge body of literature behind it, encompassing the algorithm itself and optimisations that make it work well in practice.

> A distinguished coordinator sends the new value to all participants who vote on whether to commit
>
> The coordinator **waits** for a `yes` vote from each
> 
> Once it has received all votes, it sends a `commit` command to each, or a `rollback` if there was any `no` or timeout

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> Discuss partitions</div>

### Failure handling

* On a `no` vote from any participant, the coordinator rolls back the transaction, and the state is unchanged.
* Failure of a participant before reply leads to a delay, after which the coordinator times out. It could remove the failed participant from the system and retry.
* Failure of a participant after reply leaves all other participants unaffected and in the new state.
* Failure of the coordinator is bad. Participants will remain in a valid state, that of the previous commit, but something else is required to pick a new coordinator and continue.

### See also

* Tree-based 2PC for reducing the workload of the coordinator at the expense of more message-passing delays up the tree of participants

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> Discuss extensions in availability groups, standard optimisations</div>

# CP -- sacrificing availability

## Paxos

Paxos does not appear to be so widely known or understood as 2PC. Indeed the Raft algorithm was designed specifically to be easier to learn than Paxos while giving the same guarantees.

> The _proposer_ **prepares** an update by asking a quorum of _acceptors_ to promise not to accept any proposal numbered less than `n`
>
> The _acceptors_ reply with this **promise** (along with the greatest number proposal for which they've given the same promise) or a `CONFLICT` message indicating that they can't
>
> The _proposer_ **requests accept**, asking those _acceptors_ to accept its value `v` numbered `n`
>
> the _acceptors_ **accept** the value unless they've already promised not to. The value `v` is chosen once a quorum accept it

## Raft

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span></div>

# AP -- sacrificing consistency

You may not always need strict 'one-copy' consistency, in which all of the state machines have the same state all of the time. It is unlikely that you'll want your system's nodes to become arbitrarily different, but it may be OK to weaken the consistency requirement. It might even be that you can never guarantee that two nodes of your system are in the same state at any one time, and that might be fine.

It boils down to being able to handle updates being processed out of order.  This typically requires some means of conflict resolution (specify some domain-specific rules about how to process the updates, or use time to synchronize) or arranging that updates will never conflict (make operations commutative/associative/idempotent). Updates might need to be constrained to being causally ordered, but that's usually fine too.

<div class="bs-callout bs-callout-danger"><span class="heading">TODO</span> expand</div>

There are a few versions of this:

* eventual consistency -- requiring that for each node, any update is eventually visible
* quiescent consistency -- if you stop updating the state, eventually all nodes converge to the same state

Enter **C**onflict-free **R**eplicated **D**ata **T**ypes, built on the idea that if you can describe the operations on your state machine to be commutative, associative and idempotent then each node just dumps whatever operation it performs into the rest of the network.

You'll CRDTs described in two flavours, both of which can be called conflict-free. The **C** can stand for

* **commutative** -- the operations one. Nodes send messages describing operations to be performed (think: arithmetic, with a way of ensuring idempotency)
* **convergent** -- the state one. Nodes send messages describing the new state, and the state machine has a known way of merging it in (think: counting storing the local count, merge operation is `max`)