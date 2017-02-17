---
layout: post
title: "Gödel Blockchain Theorem"
description: "blockchain has bounds"
meta_description: "A blockchain allows independent parties to make verifiable statements. This works with Bitcoin, whose value is determined inside the system, but fails in applications where the value is external."
categories:
- post
tags:
- article
- software
- draft
status: published
type: post
author: Joe Kearney
---

{% include image-float.html src='/images/kurt-godel.jpg' txt_alt='Kurt Gödel, owner of zero BTC' caption='Kurt Gödel' id='kurt-godel-portrait' side='right' %}

One of my favourite mathematical results is the [Gödel Incompleteness Theorem][godel-incompleteness-wiki]. It describes that in a formal language you can make statements that are true but that can't be proven true within the system itself[^1]. In order to prove these statements you need to use truths external to the system.

A blockchain is a data structure that became known as the foundation of Bitcoin. Viewing blockchain as a system in which you build up statements of truth, there's a tenuous analogy to verifying statements in formal languages. Blockchain is one of those technologies that acquires advocates for [more problems than it really suits][tones-blockchain-for-that].

> I argue that for applications in which the verification of statements encoded in a blockchain requires external facts, blockchain doesn't solve your problem.

## Verifiable sequences of statements

The selling point of blockchain is that its record of events is verifiable by all parties, even where they have **no trust relationship**. At its core, blockchain allows you to trust information from untrusted parties. I don't need to know or trust you, but I can trust the contents of your Bitcoin wallet because this is proven from the sequence of events that happened in the chain, all of which are verified and therefore trusted by the whole system.

There are two uses of blockchain that I want to compare, in both of which the intention is to allow verification (proof) of statements that are represented internally in the system: Bitcoin, and using blockchain in tracking copyright in music.

* In **Bitcoin**, these statements might include "this wallet contains this many Bitcoins" and "wallet A sent wallet B some Bitcoins". Provability of a statement here means that the value of Bitcoin in a wallet is derived from the transactions in the history of the ledger.
* In **music rights**, these statements might be "this track had these performers", "this song was written by this songwriter" and "this label owns the rights to the recording". As with Bitcoin, ownership can be transferred -- I can give publishing rights, or the rights for the recording, to someone else, and a claim to ownership is verifiable in the system.

The motivation for Bitcoin is to be able to manage and send your money without requiring interaction with banks. For music rights, it's to establish transparency in a system that has traditionally had little, and to improve the quality and availability of the data, which has traditionally been fragmented and inconsistent.

## Trust relationships

Where do these two systems get their truth?

### Bitcoin

Bitcoin as a currency derives its value entirely from statements contained within the system itself. You can't[^2] create new Bitcoin, you can only be given it from another wallet. You can buy Bitcoin outside the system (give someone some dollars) and hope that they transfer the right amount of Bitcoin to you -- once they have, the Bitcoin is verifiably yours.

You need a trust relationship here with your Bitcoin dealer, because the interaction (trading dollars for Bitcoin) happens outside the system and isn't verifiable within it. But that's the only trust required in the whole system. No one else needs to trust either of you in order to trust the record of actions, because they are all verifiably valid. Once you have some Bitcoin in your wallet you're in the system, and you can add transactions to the ledger (spend Bitcoin) independently.

### Music rights

Consider how this works as a musician: after you've written and recorded your music you want to declare the ownership of this work, including your authorship and details of performers. How do you write this new information into the blockchain in a way that can be trusted by other parties?

Unfortunately the process of recording this information following a creative process seems identical to the process of fraudulently recording ownership of someone else's recording. I could claim ownership of a Justin Bieber track or a Shostakovich symphony just as easily as I could my own work.

In order to protect the integrity of this blockchain the whole community needs to be able to verify statements made. Preventing this kind of fraudulent action can't be done within the system, because they encode _new value_ entering the system, as opposed to an internal transfer of value in the Bitcoin example.

### Requiring a trusted actor

This line of argument leads inexorably to requiring some sort of gatekeeper on the system -- a **trusted entity that is allowed to write new information** into the blockchain. Traditionally this would be the role of the record labels and performing rights organisations, but the motivation of using a blockchain for music rights management is typically precisely to remove these groups from a position of required trust.

## Incompleteness of Blockchain

Bitcoin comprises a sequence of statements encoded in a blockchain, in which value is determined entirely within the system. This is a special case.

More complex applications of blockchain, in our example that of representing recorded music rights, encode statements that cannot be proven within the system, even though they may have some external (and externally verifiable) truth.

The difference between these two cases is that while the value of Bitcoin is within the system, the value of music rights is external. When a new user entering the system requires trust from all other parties, or requires centralised trust, the benefit of a blockchain is lost.

### Implications

None of this is to say that there isn't value in recording the rights of musicians and composers more transparently. But the value of using a blockchain is in not requiring trust in any specific agent, and this application doesn't allow that.

Bitcoin allows for internally verifiable claims of truth. Using blockchain to record rights allows no such internal verification without imposing centralised control on writing new information, because the value is external to the system.

This feels like another case of a cool solution looking for a problem. There would be huge benefit in having more transparent information on copyright in the music industry, but the problem is the lack visibility of that information, not its verifiability. Just stick it in a database.

## Apology

No, this wasn't a post about Gödel, it was an excuse to use a tenuous analogy to butcher some beautiful maths.

{% include clearfix.html %}

***

[^1]: There is _so_ much wrong with this horrific over-simplification, not least that there are actually two related incompleteness theorems, but it's good enough for the analogy. I'm sorry, Kurt.
[^2]: The instance in which you can create Bitcoin, mining, is a way of managing decentralised accounting that allows you to create a small amount of new money when you verify a block of transactions.

[godel-incompleteness-wiki]: https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems
[tones-blockchain-for-that]: https://bitsonblocks.net/2016/07/19/so-you-want-to-use-a-blockchain-for-that/
