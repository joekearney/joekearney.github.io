---
layout: post
title: Two Phase Commit
description: "an old friend"
long_description: "Two-phase commit is a long-established means of keeping two resources strongly synchronised. These days it's not so sexy, but it's an important piece of heritage of distributed computing."
categories:
- post
tags:
- article
- software
author: Joe Kearney
published: true
---

Two-phase commit is the granddaddy of distributed system protocols. It's widely used in traditional database clustering implementations. There's a huge body of literature behind it, encompassing the algorithm itself and optimisations and heuristics that make it work well in practice.

In 2PC, multiple transactional resources can be updated atomically -- either all participants have the new value or none do. Some common use cases:

* database master writes a value to all slaves synchronously
* taking a message from a transactional queue and writing into a database as a result

In both of these cases, 2PC provides stricter guarantees than the looser consistency we get in widely used eventual consistency approaches, including writing to slave databases asynchronously and hoping for best (chance of lost messages), or committing your resources in some order and handling duplicates. These guarantees come at a price of overhead, of course.

# How does it work?

> The proposer of a new value asks all other participants to vote to commit, then announces the decision.

Often the proposer is a designated coordinator, and remains so for many transactions. (Think database clustering, where you have a single primary and many secondary replicas.) This is not required to be the case -- multi-resource XA transaction management in principal allows any participant to propose a new value.

## Steps

1. A coordinator sends the new value to all participants who vote on whether to commit
1. The coordinator **waits** for a `yes`/`no` vote from each
1. Once it has received all votes, or after a timeout
    * it sends a `commit` command to each if `yes` was received from _all_ participants
    * it sends a `rollback` if there was any `no` or timeout

## Failure handling

* On a `no` vote from any participant, the coordinator rolls back the transaction, and the state is unchanged. This can lead to obvious liveness problems if multiple proposers are competing for the next value, but it remains safe. In practice this often means that writes come through a single master.
* Failure of a participant before reply leads to a delay, after which the coordinator times out the transaction. It could remove the failed participant from the system and retry.
* Failure of a participant after reply leaves all other participants unaffected and in the new state.
* Failure of the coordinator is bad. Participants will remain in a valid state, that of the previous commit, but something else is required to pick a new coordinator and continue.

# Extending the basic algorithm

2PC is consistent and available in the presence of failed nodes, but cannot handle partitions in the network: partitions always mean that some nodes become stale. However there are heuristics allowing various degrees of tolerance. Handling can be added to allow the system to continue in the presence of a partition, in some cases.

An interesting examples arises in reducing the quorum of nodes required to commit a value. With a single master node, writes can be considered committed even when only a majority of nodes are available (nodes responding `no` still veto a transaction).

Here I'll describe what Microsoft SQL Server does about this. This is based on experience with SQL Server in my last job, and I meant to publish this post a couple of years ago!

## Progressive reduction of quorum

**SQL Server Availability Groups** (AG) implement this sort of explicit quorum management, where the _new value_ is a transaction and there's always a distinguished **primary** replica acting as the coordinator and some secondary replicas. The primary pushes new data out to each secondary replica using 2PC. Secondary replicas are available for read-only access by clients, giving good read availability. (I'll only consider the synchronous replication model here; the asynchronous version allows consistency violations -- you can lose data when the primary fails.)

The interesting feature which allows for some partition tolerance is management of the set of replicas required for a _vote-to-commit_. The system uses a combination of communication required for commit and extra periodic polling. If a replica fails and the primary notices either through timeout during a transaction commit or failure to respond to a periodic check, the bad node can be evicted from the quorum of nodes required for commit. The system can continue to work with the smaller set of nodes. Indeed, any minority of replicas (not containing the current primary) can be removed in this way and, from the point of view of the primary, life goes on.

Progress from an external point of view does require some **cooperation by clients**, because any client connected solely to node on the other side of the partition to the primary will not be able to see new updates. A removed replica will know that it has been separated if it stops receiving the periodic communication, so can reject further communication with clients. If the client is able to connect to a replica in the same partition as the primary then the system is still available, from the clients point of view -- this is the extent to which AGs are tolerant to partitions.

As parts of the system fail, or become partitioned away from the primary, the rest can **recalculate the required quorum**. If two secondary replicas disappear from a cluster of five, the remaining three can agree that as they are the only ones left, a quorum of two of those is now sufficient to make progress. In general as long as only a minority of nodes fail between each such recalculation, the system can decrease to only two nodes. Noting that nodes in a minority partition will never become primary, we can gradually fail down to a single primary node, which still keeps running. This avoids the worst possible mode of failure, a split brain scenario in which two partitions each have a node that thinks it's the leader, and writes are issued independently.

### Failure of a master node

Failure of the primary in a system with a dedicated leader requires something else, such as a round of a consensus protocol to elect a new leader. Something like Paxos consensus can be used here in general to pick a new leader.

SQL Server clusters can be set with two SQL Server replicas plus a mutually accessible file share as the third "vote". The two real replicas compete to acquire a lock on a file in the share, and the winner is the new leader. Once the leader is chosen, this cluster will tolerate failure of the file share, the secondary replica or both. Failure of the leader should cause the file share lock to be released, allowing the old secondary to take control. In general, once a new leader is chosen it can establish as large a quorum of nodes as possible from the accessible nodes.

---

SQL Server clustering and AGs are a centralised solution to extending 2PC to be tolerant to some degree to network partitions. In the presence of network partitions the system is only available to clients in the same partition as the leader. Strong consistency is maintained, and without partitions clients always see the latest state.
