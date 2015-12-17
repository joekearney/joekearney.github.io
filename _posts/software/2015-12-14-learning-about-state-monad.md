---
layout: post
title: "What is the State monad?"
description: ""
meta_description: "Learning about what the State monad represents and how to use and understand it"
categories:
- post
tags:
- article
- software
- draft
keywords:
- scala
- scalaz
- state
- "functional programming"
status: published
type: post
author: Joe Kearney
---

_This post was written after working through the State chapter in the excellent [Functional Programming in Scala](https://www.manning.com/books/functional-programming-in-scala) with a group of colleagues, and intends to capture some of our discussions towards gaining an intuition about the State monad._

***

> ## The main idea:
> `State[S, A]` is a computation -- it can produce a value of type `A`, or do some more computation with intermediate state of type `S`.

`State` is a functional way of describing multi-step computation where you have some internal intermediate state. There's no mutation of the state, but the internal _immutable_ state that's carried around with the computation can change at each step.

You can think of the `A` type parameter as describing the _value that you can get out of the state_ during the course of a function. Similarly, the `S` type represents the internal computation state. (You end up saying "state" a lot when talking about this. Try to disambiguate between `State` the type that models the computation and the internal _state_ that is maintained while running the computation.)

Of course, as is clear from the definition, there's no state and no values stored in the `State` itself. Rather, you can use the things of type `A` in the course of composing functions that are applied to it, as you build up a computation. Commonly this is done in a for-comprehension, where does look like just a sequence of imperative operations. In reality the internal state is threaded through, sort of behind the scenes.

The implementation in the book looks like this. The [Scalaz implementation](https://oss.sonatype.org/service/local/repositories/releases/archive/org/scalaz/scalaz_2.11/7.2.0/scalaz_2.11-7.2.0-javadoc.jar/!/index.html#scalaz.package@State[S,A]=scalaz.package.StateT[scalaz.Id.Id,S,A]) is a lot less straightforward, but captures the same idea.

{% highlight scala %}case class State[S, +A](run: S => (A, S)) { ... }{% endhighlight %}

## Example: swapping head of a stack

In the following example imagine swapping the top two elements of a stack. At each

(I'm totally ignoring the case where the input stack has few elements. Just pretend.)

{% highlight scala %}
type S = List[Int] // our stack type

def push(i: Int): State[S, Unit] = State[S, Unit] { s => i :: s }
def pop: State[S, Int] = State[S, Int] { s => s match {
  case i :: tail => (i, tail)
}}

// build up our program
val f: State[S, S] = for {
  i1 <- pop      // State[S, Int]
  i2 <- pop      // State[S, Int]
  _  <- push i1  // State[S, Unit]
  _  <- push i2  // State[S, Unit]
  s  <- get      // State[S, S]
} yield s

// then run it
val result: S = f.run(Stack.empty)._1
{% endhighlight %}

As with many constructions around monads, _nothing actually happens_ until right at the end. Most of your code is describing the program that will be run, effectively building a single function that takes your starting state and spits out an end state. Only afterwards do you actually run the function. This is very different to imperative programming where you can imagine that each operation is run as it is encountered.

## Sidebar: for-comprehensions and `M[_]`

Let's step back and look at what's required for a type to be used in a for-comprehension. We need only `map` and `flatMap`, whose types are defined like this:

{% highlight scala %}
trait M[A] {
  def     map(f: A => B): M[B]
  def flatMap(f: A => M[B]): M[B]
}
{% endhighlight %}

The type `M` here can be anything that has one type parameter, or anything that you can make _look like it has_ one type parameter -- it's more about finding a type with the right number of _holes_. In particular, if you have more, you can just fix the other type parameters. In maths-speak this is like taking a projection onto only one dimension; in pseudocode it's like saying, for example `type M[_] = State[S, _]`. (See [this post about `sequence`](/posts/sequence-all-the-things/) for an example introducing type lambdas, the actual Scala notation for this.)

### "What is passed to `get`, if we're ignoring the previous output?"

Back to the stack example. Aren't we discarding the output of the `get`? No -- don't think about it too _imperatively_; the for-comprehension all boils down to maps and flatMaps, and while it's harder to visualise these it's important to understand how the computation state is threaded through the sequence of functions.

{% include todo.html note='give example of de-sugared for-comprehension' %}

## The stateless operations on `State`

There are a few standard operations we can use on `State`, which modify the internal state. Each of these is itself a `State` wrapping some function that composes with the rest of your computation.

{% highlight scala %}
object State {
  def get[S](): State[S, S] = State { s => (s, s) }
  def set[S, Unit](s2: S): State[S, Unit] = State { s => ((), s2) }
  def modify[S](f: S => S): State[S, Unit] = State { s => ((), f(s)) }
}
{% endhighlight %}

* `get` makes the internal state accessible -- by turning it into a `State[S, S]` the internal state is the argument to the next map/flatMap call.
* `set` replaces all existing state with a new `S`. The resulting `State` has a second type parameter of `Unit` because you don't have a "value" any more.
* `modify` is like `map` but acts on the state instead of the values.

***

{% highlight scala %}
case class State[S, +A](run: S => (A, S)) {
  def map[B](f: A => B): State[S, B] = State { s1 => {
    val (a, s2) = run(s1)
    (f(a), s2)
  }}
  def flatMap[B](f: A => State[S, B]): State[S, B] = State { s1 => {
    val (a, s2) = run(s1)
    // f(a) on its own satisfies the type but loses the state s2
    f(a).run(s2)
  }}
}
{% endhighlight %}
