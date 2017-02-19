---
layout: post
title: "Gödel Blockchain Theorem"
description: "limits of verifiability"
meta_description: "A blockchain allows independent parties to make verifiable statements. This works with bitcoin, whose value comes from the system itself, but fails in applications where the value is external."
categories:
- post
tags:
- article
- software
- comments
- draft
status: published
type: post
author: Joe Kearney
---

_Many thanks to [Antony Lewis][bitsonblocks] for reviewing this and helping make it say what I actually meant!_

***

{% include image-float.html src='/images/kurt-godel.jpg' txt_alt='Kurt Gödel, owner of zero BTC' caption='Kurt Gödel' id='kurt-godel-portrait' side='right' href="https://en.wikipedia.org/wiki/Kurt_G%C3%B6del" %}

One of my favourite mathematical results is the [Gödel Incompleteness Theorem][godel-incompleteness-wiki]. It describes that in a formal language you can make statements that are true but that can't be proven true within the system itself[^1]. In order to prove these statements you need to use truths external to the system.

A blockchain is a data structure that became known as the foundation of bitcoin, and has uses in other contexts. With apologies to Prof Gödel, there's a tenuous analogy that I'd like to draw between verifying statements in formal languages and validating statements made about a blockchain.

> I argue that for applications of a blockchain in which the verification of statements requires external facts, blockchain doesn't solve your problem.

## Verifiable statements

The selling point of blockchains is that its record of events is verifiable by all parties, even where they have **no trust relationship**. At its core, blockchain allows you to trust information from untrusted parties, because only valid information can get into the system. I don't need to know or trust you, but I can trust how many bitcoins you have because this is proven from the transactions that happened in the chain, all of which are themselves verified and can therefore be trusted by everyone.

There are two uses of blockchain that I want to compare, in both of which the intention is to allow verification (proof) of facts about the system: bitcoin; and tracking copyright in music.

In **bitcoin** a transaction might be described as "wallet[^2] A sent wallet B some bitcoins", and the system enforces that all transactions in the ledger are valid -- true. You can then make statements like "wallet B contains X bitcoins", truth of which mean validation derived from the transactions in the history of the ledger.

There has been discussion of using blockchains in tracking **music rights**, which might include statements like "this track had these performers", "this song was written by this songwriter" and "this label owns the rights to the recording". As with bitcoin, ownership can be transferred -- I can give publishing rights, or the rights for the recording, to someone else. You might then want to verify a claim of ownership of some rights.

The motivation for bitcoin is to be able to manage and send your money without requiring interaction with banks. For music rights, it's to establish transparency in a system that has traditionally had little, and to improve the quality and availability of the data, which has traditionally been fragmented and inconsistent.

## Truth

What does it mean for a statement made in the context of one of these systems to be *true*? Let's look at both.

### Bitcoin

> I have X bitcoins

Bitcoin as a currency derives its value entirely from the transactions contained within the system itself, and enforcing validity of transactions means you can't spend bitcoin you don't control. You can buy bitcoin outside the system (give someone some dollars) and hope that the seller transfers the right amount of bitcoin to you -- once they have, the bitcoin is verifiably yours.

You need a trust relationship here with your bitcoin dealer, because that interaction (trading dollars for bitcoin) happens outside the system and isn't verifiable within it. But that's the only trust required in the whole system. No one else needs to trust either of you in order to trust the record of actions, because these records are all verifiably valid. Once you have some bitcoin in your wallet you're in the system, and you can add transactions to the ledger (spend bitcoin) independently.

**Side note**: this is the same duality between state and the transitions that get you there as is exploited in event sourcing between a database and the log of events to build it. The event/transaction is the _source_ of truth; the current contents of the database/value of a wallet is only _derived_ from those events.

### Music rights

> I wrote this song

Consider how this works as a musician: after you've written and recorded your music you want to declare the ownership of this work, including your authorship and details of performers.

What's to stop you recording ownership of someone else's work? How do you write this new information into the blockchain in a way that can be trusted by other parties? I could claim ownership of a Justin Bieber track or a Shostakovich symphony just as easily as I could my own work.

In order to protect the integrity of this blockchain the whole community needs to be able to verify statements made. In bitcoin this is intrinsic but, in recording external facts, preventing this kind of fraudulent action can't be done within the system. This is _new value_ entering the system, as opposed to an internal transfer of value in the bitcoin example.

### Requiring a trusted actor

The problem here is distinct notions of truth. In bitcoin, statements around ownership can be evaluated internally; with any system where you're just recording external facts, this isn't the case.

This leads inevitably to requiring some sort of gatekeeper on the system. This is known as an _oracle_, a **trusted entity that is allowed to write new information**. Traditionally this sort of role would be fulfilled by the record labels and performing rights organisations, because they have all of the information. But the motivation of using a blockchain for music rights management is typically precisely to remove these groups from a position of required trust.

## Incompleteness of Blockchain

Bitcoin uses a blockchain to record events, and the truth of statements about bitcoins is determined entirely within the system. This is a special case.

In more complex applications, in our example that of representing copyrights, the blockchain records information whose value is external to the system. The truth of a statement cannot be proven within the system, even though it may have some external (and externally verifiable) truth.

The difference between these two cases is that while the value of bitcoins comes from the system itself, the value of music rights is external. When a new user entering the system requires trust from all other parties, or requires centralised trust, the benefit of using blockchains is lost.

### Implications

None of this is to say that there isn't value in recording the rights of musicians and composers more transparently. But the value of using blockchains is in not requiring trust in any specific agent, and this application doesn't allow that.

Bitcoin allows for internally verifiable claims of truth. Using blockchain to record rights allows no such internal verification without imposing centralised control on writing new information, because the value is external to the system.

This feels like another case of a [cool solution looking for a problem][tones-blockchain-for-that]. There would be huge benefit in having more transparent information on copyright in the music industry, but the problem is the lack visibility of that information, not its verifiability. Just stick it in a database.

## Apology

No, this wasn't a post about Gödel, it was an excuse to use a tenuous analogy to learn a little about blockchains and butcher some beautiful maths.

{% include clearfix.html %}

***

[^1]: There is _so_ much wrong with this horrific over-simplification, not least that there are actually two related incompleteness theorems -- existence of true but non-provable statements, and impossibility of proving consistency from within the system. But it's good enough for the analogy. I'm sorry, Kurt.
[^2]: I'm using "wallet" instead of "address" because I think it gives a clearer intuition on what's happening. Please consider them interchangeable if you actually know how bitcoin works.

[bitsonblocks]: https://bitsonblocks.net/
[godel-incompleteness-wiki]: https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems
[tones-blockchain-for-that]: https://bitsonblocks.net/2016/07/19/so-you-want-to-use-a-blockchain-for-that/
[peano]: https://en.wikipedia.org/wiki/Peano_axioms
