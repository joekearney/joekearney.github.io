---
layout: post
title: "Sequence All The Things"
description: "implement sequence on your own types"
long_description: "How to add Applicative and Traverse instances for your own types, use sequence, sequenceU and Unapply"
categories:
- post
tags:
- article
- howto
- software
- comments
- highlight
keywords:
- scala
- scalaz
- sequence
- applicative
status: published
type: post
author: Joe Kearney
---

This post describes how to write a `sequence` method for your shiny new type `F`. This allows you to get from a type `G[F[A]]` to `F[G[A]]` -- that is, to swap the order of your types. Here I'll be using scalaz, and there is no magic involved. For many common types everything is already there for you, but if you write your own `F[_]` then there's a little work to make it all fit together.

There limits on what the two types can be here, but in general:

> `sequence` takes a `G[F[A]]` and gives you a `F[G[A]]`

## Intuition

Consider your type to be like `Option` and the other type to be `List`. Starting with a list of options, you want to be able to get an optional list, which is present only if all of the options in the original list were present. If anything was absent, the returned `Option[List]` is absent.

## Executive summary

You only need a few things in order to make this work, which I'll describe below:

* an `Applicative[F]` instance for your type, e.g. `Option`
* a `Traverse[G]` instance for the other type, e.g. `List`
* syntax support from `scalaz.syntax.traverse._` to add the `sequence` method to the `G` type
* consider using `sequenceU` if your type is more complicated than one with a single type parameter

# Simple start with `MyOption[A]`

Let's start with the simple example of implementing an option type, called `MyOption`. The minimal implementation looks something like this:

{% highlight scala %}
sealed trait MyOption[+A] {
  import MyOption._

  def map[B](f: A => B): MyOption[B] = this match {
    case Some(a) => Some(f(a))
    case None => None
  }
  def flatMap[B](f: A => MyOption[B]): MyOption[B] = map(f) getOrElse None
  def getOrElse[B >: A](b: => B): B = this match {
    case None    => b
    case Some(a) => a
  }
}
object MyOption {
  case object None extends MyOption[Nothing]
  case class Some[A](val get: A) extends MyOption[A]
}
{% endhighlight %}

The usage we're trying to support might look like this:

{% highlight scala %}
val o1: MyOption[Int] = Some(3)
val o2: MyOption[Int] = Some(5)
val listOfOptions: List[MyOption[Int]] = List(o1, o2)
val optionalList: MyOption[List[Int]] = listOfOptions.sequence // Some(List(3, 5))
{% endhighlight %}

For a start, scalaz provides the `Traverse[List]` instance for us. This import says: give the scalaz helpers (specifically the typeclass instances) for the standard list type.

{% highlight scala %}
import scalaz.std.list._
import scalaz.syntax.traverse._
{% endhighlight %}

Now you need an `Applicative` for `MyOption`. It turns to be easier to create a `Monad`, which extends `Applicative` anyway.

{% highlight scala %}
import scalaz.Monad
implicit object MyOptionMonad extends Monad[MyOption] {
  // lift any A into my type, there's only one way to do this and it's obvious
  def point[A](a: => A): MyOption[A] = Some(a)

  // this is exactly flatMap, so just do that
  def bind[A, B](oa: MyOption[A])(f: A => MyOption[B]): MyOption[B] = oa flatMap f
}
{% endhighlight %}

That's it: you can now do `listOfOptions.sequence` to turn a `MyOption[List[A]]` into a `List[MyOption[A]]`.

Bonus: to do the reverse, create a `Traverse` for `MyOption`. Traverse acts a bit like flatMap,

{% highlight scala %}
implicit object MyOptionTraverse extends Traverse[MyOption] {
  def traverseImpl[F[_], A, B](fa: MyOption[A])(f: A => F[B])(implicit F: Applicative[F]) =
    fa map (a => F.map(f(a))(Some(_): MyOption[B])) getOrElse F.point(None)
}
{% endhighlight %}

Then you can do `.sequence` on a `List[MyOption[A]]` and get a `MyOption[List[A]]`. Note that it's not always possible to map in both directions, because of the required properties of being able to find `Applicative` and `Traverse` instances.

{% capture what_is_applicative %}
## Sidebar: what is `Applicative`?

From the [scalaz docs](https://oss.sonatype.org/service/local/repositories/releases/archive/org/scalaz/scalaz_2.11/7.2.0/scalaz_2.11-7.2.0-javadoc.jar/!/index.html#scalaz.Applicative) on `Applicative`. Intuitively, start by thinking of _in a context_ as meaning inside a container like `Option`.

> Whereas a *functor* allows application of a pure function to a value in a context, an *applicative* also allows application of a function in a context to a value in a context

Start with `Functor`. This is a function that can be applied to a value in a context; think of applying `_ + 1` to an `Option[Int]`.

With `Applicative` the function is also in a context, so you might have an `Option[Int => Int]` that you can apply to an `Option[Int]`.

The type parameter on `Applicative` is the context type constructor, so for our example it's `MyOption`.
{% endcapture %}
{% include sidebar.html content=what_is_applicative %}

# Type Lambdas and `Either[L, R]`

It's more tricky when your type has more than one type parameter, because you need to force your type into fitting into `Applicative[A[_]]`, which takes one type parameter. The only good way of doing this is with a type lambda. The idea is that you _fix_ one of the parameter types; here we fix `L`. You might call this a partially applied type constructor -- this is exactly analogous to partial application of a function, where some of its parameters are fixed.

The expression `({type t[a] = MyEither[L, a]})#t` means: a type `t` that takes one type parameter, and which is equal to `MyEither[L, _]`. This is an unfortunately complicated syntax for a simple idea.

Fixing one type parameter gives you a new type constructor that has only one type parameter. We can use this to create the `Applicative`. Note it's not an `object` now, since we need one per type `L` that we fix for the first type parameter.

{% highlight scala %}
implicit def MyEitherApplicative[L]: Applicative[({type l[a] = MyEither[L, a]})#l] =
  new Applicative[({type l[a] = MyEither[L, a]})#l] {
    // lift any A into my type
    override def point[A](a: => A): MyEither[L, A] = Right(a)

    // given an applicative functor ef and an argument inside ea,
    // apply the function inside to the argument inside, if they're both there
    override def ap[A, B](ea: => MyEither[L, A])(ef: => MyEither[L, A => B]): MyEither[L, B] =
      for {
        a <- ea
        f <- ef
      } yield f(a)
}
{% endhighlight %}

This isn't quite enough: attempting to compile `listOfMyEithers.sequence` gives cryptic error messages about `could not find implicit value for parameter ev: scalaz.Leibniz.===[MyEither[String,Int],G[B]]`, which amounts to saying that it couldn't find the required implicit to prove that `MyEither` has an `Applicative` instance. (The [Leibniz](https://oss.sonatype.org/service/local/repositories/releases/archive/org/scalaz/scalaz_2.11/7.2.0/scalaz_2.11-7.2.0-javadoc.jar/!/index.html#scalaz.Leibniz) part is about the equality condition required between your type and the `Applicative`.)

It's possible to solve this with another type lambda, allowing the compiler to understand how you want to deconstruct the `MyEither` into something that can be expressed with a single type parameter. An easier way is with `sequenceU`, a different implementation of the same idea of `sequence`. With the same imports as above:

{% highlight scala %}
import scalaz.std.list._
import scalaz.syntax.traverse._
val sequencedListOfLefts: MyEither[String, List[Int]] = listOfMyEithers.sequenceU
{% endhighlight %}

## Woah, what just happened there?

`sequenceU` is a method that implements the same behaviour as `sequence` but expresses the types differently, allowing the types to be inferred. This works through a type called `Unapply` that represents a type with one type parameter, but using a typeclass to provide the relation between the outer and inner types.

The implicit being used here can be created explicitly as the following. This says, paraphrasing the docs: unpack a value of type `MyEither[A, B]` into types `[b]M[A, b]` and `B`, and then find an `Applicative` instance for the partially applied type `MyEither[L, _]`.

{% highlight scala %}
implicit val u: Unapply[Applicative, MyEither[String, List[Int]]] =
  Unapply.unapplyMAB2[Applicative, MyEither, String, List[Int]]
{% endhighlight %}
