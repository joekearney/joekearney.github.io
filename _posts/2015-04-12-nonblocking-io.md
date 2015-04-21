---
layout: post
title: "Learning about Non-blocking IO"
description: "no-code intro"
categories:
- work
tags:
- interesting
- draft
author: Joe Kearney
---

I have got away without using non-blocking IO directly until recently, because I've not worked on anything that had to scale to a large number of users. Sure, blocking reads and writes have become stuck and stuff has broken, but it's honestly never been too big a deal. If everything is wrapped in timeouts and retry then eventually everything sorts itself out. You don't get away with this when trying to handle large numbers of connections, so something must be done.

Time to learn: this post is an effort to explain to myself what's going on and why, and what better place to write than on a flight over hours of empty outback!

The introductions I've seen to asynchronous/non-blocking IO tend to talk about selectors and keys, the mechanics of how it works. I think the motivating examples from a higher level can be more instructive of the general shape of what's going on, and the details can follow (not in this post). What follows describes the different options I covered when trying to figure out how to make IO scale, from first principles with the tools that we already have, that is, using blocking IO. It turns out that "real" async IO does roughly the same thing, but the deeper hooks allow this to be done more efficiently.

As a little context, **the use case that motivated this** was a server processing an ordered stream of messages to be sent to many connected clients. Each client receives some subset of the messages and must receive its messages in order.

## Making Blocking IO Safe

As a first step we'll consider how to make normal blocking IOsafe and discuss how to offload the work to other threads. This amounts to an inefficient reimplementation of proper non-blocking IO, but illustrates what's going on.

Suppose you want to write messages to many clients. A client connection might break, which from the point of view of the server process means it may throw an exception or just hang. There are two specific properties that the server implementation should maintain:

* Client isolation: failure of one client should not affect other clients
* Message ordering: for each client, messages should be sent in series and in the correct order

In the background we also need to ensure liveness and scalability: the server should handle a large number of clients and messages should be despatched in a timely manner.

Let's look at the different options for how to perform these writes, and to what extent the required properties hold.

### 1. Single threaded
One thread to do all processing: write to one client, pick up a new message and write to the next.

This obviously doesn't scale as well as if we parallelise writes. Ordering is trivially maintained but if any client hangs then no further messages will be sent. We can add timeouts to the socket writes, we can offload synchronously to another thread to enforce timeouts and all sorts of other hacks, but we can't really get to isolation and keep liveness like this.

This is the simple first implementation, and we can do better.

### 2. Simple thread pool
The first step to parallelism -- just naïvely offload the IO work to another thread. This boils down to having a single queue of write tasks serviced by a pool of threads. This provides client isolation because no bad operation can block execution of future tasks on other clients. Of course, a pool with a fixed number of threads can only handle that number of failures, but it's a start.

The problem here is in ordering: nothing prevents two threads attempting to run tasks for the same client simultaneously, and the wrong one could be scheduled first. The race condition here would have to be handled.

One thread per client, outbox per client
The server could put the message to be sent on an "outbox" queue per client, rather than a single common queue. Then providing a worker thread per client allows both isolation and ordering, but at the expense of having to manage this thread per external client. Clearly this won't scale with the number of client connections.

### 3. Striped executor
There is a compromise between these two, which is to group the clients and service a queue of write tasks with one thread per group. You can imagine grouping by hash of the client ID, or just explicitly when the client object is created, for example. You'd want to partition clients into approximately equally sized groups and may have to allow for changes to clients during the lifetime of the server.

You get ordering for each client's messages by virtue of the serially processed task queue, and the effect of client failures is limited to clients in the same group.

The trade-off here is between the number of threads that you can run against the size of the failure domain -- creating more threads means a smaller set of innocent clients affected by each client failure.

### 4. Outbox per client serviced by thread pool
This is what you get when you apply a thread pool to the outbox-per-client approach. If queue processing is forced to be single-threaded then processing per client remains single-threaded and ordering and isolation are maintained without having to have so many threads.

The tricky part is ensuring that only one worker thread works on a client at a time without requiring blocking synchronisation. You can imagine a scheme where, on posting a message to an outbound message queue, one of the worker threads is woken up to do some work. You could point awakened threads to a message queue by adding a reference to some client state object to an outstanding work queue, and perhaps trying to acquire a semaphore-style permit to work on that client's messages.

The mechanics of doing this safely and lock-free might be a bit messy, but in principle it solves the problem. This is a bit hand-wavey but feels plausible with a bit of care around the concurrency management.

## Non-blocking IO

Blocking IO means that you have to wait while the IO work is happening. Non-blocking IO can just mean that someone else does the blocking for you, asynchronously. That's what we've worked through in the above, to varying levels of success in the different approaches.

Asynchronous non-blocking IO implements conceptually the last design. In Java a thread pool does the work and interacts with the selector/key stuff that we can skate over for now. When the system is ready for some IO to happen a thread is woken up to do it, and you can have a callback into your code once it's been done.

The API, at least in plain Java, is much more complicated than sockets and byte streams and can look like a horrible mess of deeply nested anonymous inner classes. I'm yet to explore libraries like Netty and scalaz-streams to any great extent, but these and others promise abstraction over the basic API.