---
layout: post
title: Interviewing for programmers
categories:
- work
tags:
- interviews
- interesting
status: publish
type: post
published: true
author: Joe Kearney
permalink: /work/interviewing-for-programmers.html
---

<div class="title-image">
	<img src="/images/i-can-haz-ze-job.jpg" alt="I can haz ze job?">
</div>

In the last three years I've given about 150 job interviews, not an unusual rate among our developers. The company is renowned for its arduous interview process; I had about 15 interviews before receiving an offer. (This isn't the moment, but I applaud the thorough nature of this process and am happy to argue the case against those who claim it's too much.)

It seems only fair to try to describe how I approach giving an interview, to distil some of my aims.

Let's start at the beginning.

## What are we trying to achieve in an interview?

I'm a programmer, you're a programmer. The reason you're here is to decide whether we will be able to work productively together, should you be offered a job.

My interviews broadly attempt to answer three questions. Hopefully the answer for all three will be positive; then you might get a good mark from me. After that it's up to your other interlocutors.

## 1. Can I have a meaningful conversation with you?

This section should be about little more than vocabulary and the ability to sustain conversation in a programming or computer science context. If we're going to work together we need to be able to share ideas in design and implementation. **This is the part where you need some actual knowledge and an understanding of the first principles**, from which we can derive everything else later.

You should be able to describe how to construct a hash table and tell me that insertion and lookup take constant time, preferably with that slightly worried frown that shows that you're worried about the cases in which that can't be considered true. Obviously you need a grasp of the basic list implementations and their properties, because this is what you learned in the first week of your degree, back when you were paying attention. You should know that operations on trees are logarithmic and maybe even know of a couple of different implementations. We need to be able to talk fluently about complexity of the usual operations -- *O*(*n*&nbsp;log&nbsp;*n*) should make you jump up and scream "sorting!" (We actually have acoustic tiles in some of the meeting rooms, and that must be for just this purpose.)

It's nice to know that once upon a time you cared enough to understand how various implementations compare and why some are chosen over others, and that you were curious enough to stumble across and be enriched by their less popular cousins like the skip list and the Fibonacci heap. But I do not expect deep specific knowledge of obscure structures. I don't expect you to be able to describe in detail, from memory, the fiddly bits of standards (for example red-black tree node rotation or even quicksort), though you might drop a hint in passing that you're aware of what happens in principle. I have a copy of the [CLRS book](http://mitpress.mit.edu/books/introduction-algorithms) on my desk for when I really need to implement or remind myself about the low level details, but it doesn't get used all that often -- even as a library developer I didn't need to implement sorting. Anyway.

This should all be *just* vocabulary; it should be second nature. This stuff should be in your constant pool.

Often the first technical question in an interview with me is a test of your plausibility as a developer. The great candidates sail through it and might add some sprinkles of novelty, but there's just not a lot of room to impress yet. Even the average candidates should answer this with no trouble. The value here is that it exposes the weak. If we spend more than about three minutes here then either it's going very badly or you've found some new fascinating angle on an almost trivial problem. I have had one or two marvellous interviews of the latter type, but too many where I get the sinking feeling within five sentences that everyone is wasting their time.

## 2. Can you apply your knowledge?

Having the vocabulary is required just to participate in the conversation. Once we've established that, I want you to **show some real understanding of these structures and show that you're smart enough to use that understanding effectively**.

Perhaps you can adapt a standard data structure to adhere to some new constraint, or combine multiple structures to improve performance in certain cases. Maybe I'll start suggesting ridiculous abuses of normal structures and algorithms and ask you to calculate reasonable complexity bounds. That sort of thing. If you look sufficiently appalled when I suggest running binary search over a linked list, we can probably skip a couple of steps.

This is also where concurrency might come in. We might talk about different models of concurrency; most people who get through are comfortable talking about using locks and lock striping, map-reduce-style algorithms, and sometimes onto the more interesting lock- and wait-free algorithms. Maybe we'll look a level of abstraction higher, at executors, futures and more general message passing. At the sophisticated end it's quite difficult to cover the details with pen and paper, but again you should at least be able to indicate what's going on, perhaps with the aid of the *happens-before* descriptions of the JMM or similar. If you say you know concurrency in Java, know what `volatile` actually means. Maybe you've looked at [CLQ](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ConcurrentLinkedQueue.html) and Michael and Scott, or the cool new [TransferQueue](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/LinkedTransferQueue.html) stuff, and if so it's great when we can share some enthusiasm about how these outrageously clever ideas can be so elegant.

## 3. Could we solve problems working together?

Up until this point we've remained quite academic, and hopefully not used more than half of my hour. If you've got this far, we should have established that we can succinctly discuss problems and designs for solutions.

It's hard to test our ability to work together in such a one-sided situation as a job interview. The only reasonable proxy I've found for this is to check that you think straight: that you can **approach a problem systematically**, perhaps from multiple directions, even if there is no straightforward way to proceed. Very few people come to a satisfactory final solution to these problems, and indeed I've asked some questions that have no reasonable closed-form solution, but that's not the point. Good answers often show a willingness to start with a simple, obvious or naïve solution, that is correct even if it performs badly. We can iterate from here through incremental improvements to the solution, or maybe you'll think of something more promising and jump to another line of attack.

So this section will often come as something with a more practical bent. I try to take this question from a problem that has come up in actual work. It'll likely be a distilled version of the original, but it will be something more concrete than before. Again, the solution will likely involve using data structures together or creating your own from the ground up. And again you should be able to talk about how it would perform: I'm still interested in asymptotic complexity bounds, but I also want to see you thinking about how it might perform in practice. There's always a bonus mark for refusing to endorse one of two similar-looking implementations without benchmarking them. You might start suggesting heuristics for improving performance, but you'll have to be pretty sure that you can justify correctness if you do.

An alternative is a small coding example. Yes, this is notoriously difficult to get right on paper, and no, there's no real opportunity here to shine. There is, however, ample opportunity to shoot yourself in the foot; this is often another question that separates the weak candidates from rest rather than the strong from the others, and as such it shouldn't take long. I don't care about typos that you'd never make in an IDE. The lack of a compiler in my sheet of A4 means that this really will be a short example -- I won't ask you to do anything that should take more than 8-10 lines of code. With a little organisation, and probably after drawing for yourself some little pictures of the problem, there's little excuse for failing to get this completely correct. (Assuming you pass a few interviews I would expect you to face a larger coding exercise outside the interview room, which will provide a far better indication of actual *coding* ability.)

## What have we learned?

If you get this far then hopefully we'll have talked about some interesting corners of computer science, as well as having glossed over the easy basics. It's much more interesting for both of us, and more likely to be successful for you, if this is a conversation between curious equals and not an interrogation.

I get quite hung up on the idea that you should nail the basics, the stuff that should be your primitives. So I'll reiterate this once more. [Joel Spolsky](http://www.joelonsoftware.com/articles/GuerrillaInterviewing3.html) states the same sentiment thus:
> If the basic concepts aren't so easy that you don’t even have to think about them, you’re not going to get the big concepts.
> - Joel Spolsky

But if we can have a real conversation then this could be the start of something.
