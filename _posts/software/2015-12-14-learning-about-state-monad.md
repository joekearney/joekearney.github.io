---
layout: post
title: "What is the State monad?"
description: "functional programming with state"
long_description: "Learning about what the State monad represents and how to use and understand it"
categories:
- post
tags:
- article
- software
- comments
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

You can think of the `A` type parameter as describing the _value that you can get out of the state_ during the course of a function. Similarly, the `S` type represents the internal computation state. (You end up saying "state" a lot when talking about this. Try to disambiguate between the `State` type that models the computation and the internal _state_ that is maintained while running the computation.)

Of course, as is clear from the definition below, there's no state and no values stored in the `State` itself. Rather, you can use the things of type `A` in the course of composing functions that are applied to it, as you build up a computation. The state and values exist only as function arguments that get threaded through the computation.

Commonly this is used in a for-comprehension, where it looks like a sequence of imperative operations. In reality the internal state is threaded through, sort of behind the scenes.

The implementation in the book looks like this. The [Scalaz implementation](https://oss.sonatype.org/service/local/repositories/releases/archive/org/scalaz/scalaz_2.11/7.2.0/scalaz_2.11-7.2.0-javadoc.jar/!/index.html#scalaz.package@State[S,A]=scalaz.package.StateT[scalaz.Id.Id,S,A]) is a lot less straightforward, but captures the same idea.

{% highlight scala %}case class State[S, +A](run: S => (A, S)) { ... }{% endhighlight %}

### Motivation

You can use `State` as a pure way to run a computation where you need to modify state but want to hide the intermediate state of a computation.

`State` eliminates a certain class of bugs. The motivation in the book is in using an immutable random number generator by manually composing functions that have a similar signature `Rand[A] => (A, Rand[A])`. You need to pass the right version of the state through to the next function, else you lose an update to your internal state. Using `State`, especially in a for-comprehension, this all happens automatically, and you can't get it wrong.

On the other hand I've heard comments like "I've never actually used it in production", usually accompanied by descriptions of using related structures. So I'm thinking of this as a pedagogical tool for learning about building a program by composing functions, expecting that as we as functional programming novices progress, we will soon learn about more sophisticated structures based on the same ideas (I'm looking at you, [`ReaderWriterStateT`](https://oss.sonatype.org/service/local/repositories/releases/archive/org/scalaz/scalaz_2.11/7.2.0/scalaz_2.11-7.2.0-javadoc.jar/!/index.html#scalaz.package@RWST[F[_],-R,W,S,A]=scalaz.package.ReaderWriterStateT[F,R,W,S,A])) that have more direct application. Thinking about a program in this way is at least a new view on how to compose functionality together.

## Example: swapping head of a stack

{::options parse_block_html="true" /}
<div class="inline-image-right">
{% highlight scala %}
type S = List[Int] // our stack type

def push(i: Int): State[S, Unit] =
  State[S, Unit] { s => ((), i :: s) }
def pop: State[S, Int] =
  State[S, Int] { s => s match {
    case i :: tail => (i, tail)
  }}

// build up our program
val f: State[S, S] = for {
  i1 <- pop      // State[S, Int]
  i2 <- pop      // State[S, Int]
  _  <- push(i1) // State[S, Unit]
  _  <- push(i2) // State[S, Unit]
  s  <- get      // State[S, S]
} yield s

// then run it
val result: S =
  f.run(List(1, 2, 3, 4, 5))._1
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

Imagine swapping the top two elements of a stack. At each line in the for-comprehension the right-hand-side is some combinator acting on the state, and the type of the thing on the left is the _value type_ from the `State` on the right-hand-side.

(I'm totally ignoring the case where the input stack has few elements. Just pretend, and we'll cover the error handling aspect another day.)

As with many constructions around monads, _nothing actually happens_ until right at the end. Most of your code is describing the program that will be run, effectively building a single function that takes your starting state and spits out an end state. Only afterwards do you actually run the function. This is very different to imperative programming where you can imagine that each operation is run as it is encountered.

If you want to visualise exactly what's happening, then do so through the `run` functions that are called. The `pop` functions look like `h :: t => (h, t)`, where the input stack is decomposed into head (new value) and tail (new state). After the second invocation of this the "value" is the second item on the input stack.

### Step-by-step

These two values are used later by the `push` commands, which act as if they have side-effects and so "return" `Unit`. They don't have side-effects in any traditional sense (everything is immutable, right?), and they return a value only in the for-comprehension pull-a-value-out-of-the-right sense. This value is available later as an argument.

The last function, `get` turns the internal state into the value of the computation, so that it can be accessed after running the for-comprehension.

What is the type of the whole for-comprehension? The non-fixed type parameter is the same as the type of the `yield`ed thing, so we get `State[S, S]`. When we finally run the function that we've built up, `f.run`, we get a pair containing the value and the current internal state, so we pick off the first value of that as our result `List(2, 1, 3, 4, 5)`

<div class="clearfix"></div>

{% capture for_comprehensions_and_monad %}
### Sidebar: for-comprehensions and `M[_]`

{::options parse_block_html="true" /}
<div class="inline-image-left">
{% highlight scala %}
trait M[A] {
  def     map(f: A => B): M[B]
  def flatMap(f: A => M[B]): M[B]
}
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

Let's step back and look at what's required for a type to be used in a for-comprehension. We need only `map` and `flatMap`, whose types are defined as shown.

The type `M` here can be anything that has one type parameter, or anything that you can make _look like it has_ one type parameter, which is the input type of the functions you pass to `map` and `flatMap`. In particular, if you have more, you can just fix the other type parameters. In pseudocode it's like saying, for example `type M[_] = State[S, _]`.

At each step, `map` and `flatMap` can change this one type parameter as functions are applied, but the outer type (`State`, for us) and the fixed types (`S`) cannot change. You can't write a for-comprehension over `State` and `Option`, for example, at least not without getting into monad transformers.

(See [this post about `sequence`](/posts/sequence-all-the-things) for an example introducing type lambdas, the actual Scala notation for this.)
{% endcapture %}
{% include sidebar.html content=for_comprehensions_and_monad %}

### "What is passed to `get`, if we're ignoring the previous output?"

{::options parse_block_html="true" /}
<div class="inline-image-right">
{% highlight scala %}
val f1 = for {
  _ <- push(1)
  s <- get
} yield s

val f2: State[S, S] = State { s1 =>
  val (a, s2) = push(1).run(s1)
  get.run(s2)
}
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

Back to the stack example. Aren't we discarding the output of the `get`? No -- don't think about it too imperatively. The for-comprehension all boils down to maps and flatMaps, and while it's easier to visualise the sequence of events in the for-comprehension, it's important to understand how the computation state is threaded through the sequence of function compositions.

If you de-sugar the for-comprehension and inline `flatMap` you get the `f2` function here. This makes it explicit how the state is threaded through. The only parts of this you write yourself in the for-comprehension are the `push` and `get` calls and (sort of) the reference to `s2`.

It looks a lot less like magic when written out this way.

<div class="clearfix"></div>

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

For completeness, here are the implementations of map and flatMap for `State`.

{% highlight scala %}
case class State[S, +A](run: S => (A, S)) {
  def map[B](f: A => B): State[S, B] =
    State { s1 => {
      val (a, s2) = run(s1)
      (f(a), s2)
    }}
  def flatMap[B](f: A => State[S, B]): State[S, B] =
    State { s1 => {
      val (a, s2) = run(s1)
      // f(a) on its own satisfies the type
      // but loses the state s2
      f(a).run(s2)
    }}
}
{% endhighlight %}
