---
layout: post
title: "Just In Time"
description: "introduction to JVM compilation"
meta_description: "An introduction to compilation for the JVM, bytecode as the common code format for the JVM and just-in-time (JIT) compilation at runtime."
categories:
- post
tags:
- article
- software
- draft
keywords:
- scala
- compilation
status: published
type: post
author: Joe Kearney
---

_This post was written to accompany [a talk I gave](http://www.meetup.com/Scala-Berlin-Brandenburg/events/228703195/) at the Berlin-Brandenburg Scala User Group Meetup in February 2016._

***

## Introduction

A lot of cleverness happens between writing your code in an IDE and having run on an actual CPU, and a lot of it looks like magic, at least from the outside. This talks aims to describe a selection of the steps between your IDE and the metal. It's not going to be a complete end-to-end description, primarily because a lot of it is way beyond my expertise!

I hope that those who read this post or attend the talk with take away with them an idea of some of the tools that can be used to inspect the post-IDE lifetime of their code, and an idea of how to understand the output. I would not expect to use these tools every day, but a more important goal is to give some context of what's happening at a level beneath your source code.

There are three parts:

1. an introduction to what we mean by compilation and why it has multiple stages. What are classfiles, and what are types from the point of view of the JVM?
1. what is bytecode and how does it work? A brief comparison between how Scala and Java compile similar structures.
1. how can you see the assembler code that the JIT compiler generates to be run on the actual CPU? We'll look at this by way of some examples of benchmarking.

## 1. What is compilation?

{% include image-float.html src='https://imgs.xkcd.com/comics/compiling.png' href='https://xkcd.com/303/' id='xkcd-compiling' side='right' %}

Compiling is, of course, what happens while you're sword-fighting on office chairs.

Compiling is the process of going from **human-readable code to executable instructions** that can run on a processor. These days there are many stages to this. If you watch closely enough you can see the Scala compiler going through many different phases during compilation of Scala code to JVM bytecode, and that's just the first step, getting to the JVM's **intermediate representation**.

Why not just compile straight to machine code, skipping this intermediate step? There are a lot of reasons for this. Primarily, this intermediate step is how Java implements its "write once, run anywhere" policy -- it's a level of indirection that allows the same source code to be translated eventually into machine-specific instructions, whether a laptop, phone or data-centre blade.

But the fact that ultimate compilation is deferred until runtime has other benefits too -- it allows the compiler to **use runtime information to guide optimisation** of the code. Hotspot was originally shipped as having "just-in-time compilation **with adaptive optimisation**". At runtime your code generates a lot of information about how it is used, about distribution of parameters, hot-spots (geddit?) of code that could benefit from more aggressive optimisation. It's a profiler that automatically tunes your code.

At its core, `scalac` or any other JVM language compiler is just a function `String => Seq[ByteCode]`, bytecode being is the JVM's internal language, where the string is your program's source code. When you consider having multiple source files and multiple output classfiles containing the bytecode it's more like

```scala
Set[String] => Either[CompileError, Set[Seq[ByteCode]]]
```

***

### Resources

* Slides for this talk _(todo)_
* Alexey Shipilev's blog, in particular his post on [Nanotrusting Nanotime](http://shipilev.net/blog/2014/nanotrusting-nanotime/)
