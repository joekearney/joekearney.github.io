_This series was written to accompany [a talk I gave](http://www.meetup.com/Scala-Berlin-Brandenburg/events/228703195/) to the Berlin-Brandenburg Scala User Group in February 2016._

> Scala code is a long way from the metal. In this talk we'll see some of the steps in between, including some nuggets of JIT compilation, and I'll introduce JMH as a tool for both benchmarking and investigating what your app is actually doing.

***

# Introduction

A lot of cleverness happens between writing your code in an IDE and having run on an actual CPU, and a lot of it looks like magic, at least from the outside. This talks aims to describe a selection of the steps between your IDE and the metal. It's not going to be a complete end-to-end description, primarily because a lot of it is way beyond my expertise!

I hope that those who read this post or attend the talk will take away with them an idea of some of the tools that can be used to inspect the post-IDE lifetime of their code, and an idea of how to understand the output. I would not expect to use these tools every day, but a more important goal is to give some context of what's happening at a level beneath your source code.

There are three parts:

1. [an introduction to what we mean by compilation](/posts/just-in-time-1) and why it has multiple stages. What are classfiles, and what are types from the point of view of the JVM?
1. [what is bytecode and how does it work?](/posts/just-in-time-2) A brief comparison between how Scala and Java compile similar structures.
1. [how can you see the assembler code](/posts/just-in-time-3) that the JIT compiler generates to be run on the actual CPU? We'll look at this by way of some examples of benchmarking.

and a [short summary](/posts/just-in-time-4) to finish.

***

## Further Reading

* Slides for this talk _(todo)_
* Alexey Shipilev's blog, in particular his post on [Nanotrusting Nanotime](http://shipilev.net/blog/2014/nanotrusting-nanotime/)
