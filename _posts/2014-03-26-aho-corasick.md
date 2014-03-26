---
layout: post
title: Aho-Corasick String Matching
categories:
- algorithms-string-matching
status: draft
type: post
published: true
author: Joe Kearney
permalink: /algorithms/string-matching/aho-corasick.html
---

<div class="alert alert-success">
  <p><b>In a Nutshell</b></p>
  <ul>
	<li>Preprocess: build a state machine describing matches against some keywords</li>
	<li>Present each character of the input to the state machine to continue or fail</li>
	<li><b>Complexity</b>: linear in size of keywords plus size of input</li>
  </ul>
</div>

<div class="well">
  <img data-src="holder.js/600x400" alt="Illustration of Aho-Corasick string matching">
</div>

Opening draft of a piece about string matching.

## Resources

* [ahocorasick.org](http://ahocorasick.org/) -- Java implementation and some discussion
* [Wikipedia entry](http://en.wikipedia.org/wiki/Aho%E2%80%93Corasick_string_matching_algorithm)