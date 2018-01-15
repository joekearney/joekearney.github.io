# Introduction

> Scala code is a long way from the metal. In this talk we'll see some of the steps in between, including some nuggets of JIT compilation, and I'll introduce JMH as a tool for both benchmarking and investigating what your app is actually doing.

A lot of cleverness happens between writing your code in an IDE and having run on an actual CPU, and a lot of it looks like magic, at least from the outside. This talks aims to describe a selection of the steps between your IDE and the metal. It's **not going to be a complete** end-to-end description, primarily because a lot of it is way beyond my expertise!

I hope that those who read this post (or attended the talk) will take away with them an idea of some of the tools that can be used to inspect the post-IDE lifetime of their code, and an idea of how to understand the output. I would not expect to use these tools every day, but a more important goal is to give some **context of what's happening at a level beneath** your source code.

## Contents

{% include toc-listing.html numPosts='all' showDrafts=true tag='just-in-time' showAuthor=false showLongDescription=true orderAscending=true showOnlyArticles=true showDate=false prependSeriesToTitles=false include_series_in_post_title=false %}

***

Comments, corrections and clarifications are always welcome, whether by email, Twitter or a as a [PR for this blog](https://github.com/joekearney/joekearney.github.io)!

***

## Further Reading

* Slides for this talk _(todo)_
* Alexey Shipilev's blog, in particular his post on [Nanotrusting Nanotime](http://shipilev.net/blog/2014/nanotrusting-nanotime/)
