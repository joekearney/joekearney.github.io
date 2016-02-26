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

_This post was written to accompany [a talk I gave](http://www.meetup.com/Scala-Berlin-Brandenburg/events/228703195/) to the Berlin-Brandenburg Scala User Group in February 2016._

> Scala code is a long way from the metal. In this talk we'll see some of the steps in between, including some nuggets of JIT compilation, and I'll introduce JMH as a tool for both benchmarking and investigating what your app is actually doing.

***

## Introduction

A lot of cleverness happens between writing your code in an IDE and having run on an actual CPU, and a lot of it looks like magic, at least from the outside. This talks aims to describe a selection of the steps between your IDE and the metal. It's not going to be a complete end-to-end description, primarily because a lot of it is way beyond my expertise!

I hope that those who read this post or attend the talk will take away with them an idea of some of the tools that can be used to inspect the post-IDE lifetime of their code, and an idea of how to understand the output. I would not expect to use these tools every day, but a more important goal is to give some context of what's happening at a level beneath your source code.

There are three parts:

1. an introduction to what we mean by compilation and why it has multiple stages. What are classfiles, and what are types from the point of view of the JVM?
1. what is bytecode and how does it work? A brief comparison between how Scala and Java compile similar structures.
1. how can you see the assembler code that the JIT compiler generates to be run on the actual CPU? We'll look at this by way of some examples of benchmarking.

***

## 1. What is compilation?

{% include image-float.html src='/images/xkcd-303-compiling.png' href='https://xkcd.com/303/' id='xkcd-compiling' side='left' %}

Compiling is, of course, what happens while you're sword-fighting on office chairs.

Compiling is the process of going from **human-readable code to executable instructions** that can run on a processor. These days there are many stages to this. If you watch closely enough you can see the Scala compiler going through many different phases during compilation of Scala code to JVM bytecode, and that's just the first step, getting to the JVM's **intermediate representation**.

Why not just compile straight to machine code, skipping this intermediate step? There are a lot of reasons for this. Primarily, this intermediate step is how Java implements its "write once, run anywhere" policy -- it's a level of indirection that allows the same source code to be translated eventually into machine-specific instructions, whether a laptop, phone or data-centre blade.

But the fact that ultimate compilation is deferred until runtime has other benefits too -- it allows the compiler to **use runtime information to guide optimisation** of the code. Hotspot was originally shipped as having "just-in-time compilation **with adaptive optimisation**". At runtime your code generates a lot of information about how it is used, about distribution of parameters, hot-spots (geddit?) of code that could benefit from more aggressive optimisation. It's a profiler that automatically tunes your code.

At its core, `scalac` or any other JVM language compiler is just a function `String => Seq[ByteCode]`, bytecode being is the JVM's internal language, where the string is your program's source code. When you consider having multiple source files and multiple output classfiles containing the bytecode it's more like:

{% highlight scala %}Set[String] => Either[CompileError, Set[Seq[ByteCode]]]{% endhighlight %}

Many Scala talks, those on subjects like types, Scalaz and monads, focus on the `CompileError` part of this function, and are about proving validity of code under laws around types. Here were going assume validity of code completely, and focus on the positive outcomes of a compilation.

Once we have some bytecode, the JVM can be considered "just" the following function:

{% highlight scala %}Seq[ByteCode] => Seq[MachineCode]{% endhighlight %}

This is another compilation step, and it occurs entirely inside the JVM at runtime. The classfiles and jars compiled from your source are the inputs. It's worth noting that code is compiled per method, and different methods can be compiled independently and even by different compilers.

There are four compilers at work.

1. **interpreter** -- interprets bytecode instruction by instruction and runs the required operations on the processor. This sounds slow, and it is, but there's notably no startup cost at all.
1. **client**, or **C1** -- one of two "proper" compilers in the JVM. It compiles quickly, performs some optimisations on the code but is primarily concerned with completing quickly. It's good for programs that need quick startup. It's often used for short-lived apps or human-facing GUIs.
1. **server**, or **C2** -- the more aggressive cousin of C1. This takes the other side of the tradeoff, sacrificing startup speed (compilation times) for later runtime speed thanks to much greater optimisation of code.
1. **tiered** -- chains together the other three, to get the benefits of quick startup times with eventual high performance. The level of optimisation is progressive. After the first few interpreted invocations a method will be compiled by C1, and after a few more (usually on the order of 10,000) the method will be recompiled and a faster, shinier version swapped in.

### Types and classfiles

Bytecode is organised into classfiles, and one type is stored in each file. **What's a type**, in this context?

Languages express their types in different ways. Scala has three **kinds** of types: `object`s, `class`es and `trait`s; while Java has two: `class`es and `interface`s.

(**Aside**: counting kinds like this is at least reasonable, but the exact numbers depend on the details. Scala's `case class`es are just `class`es with some free sugar. Java's `enum`s are just `class`es too and annotations are really interfaces, at least at the classfile storage level, and though Java and the JVM have the whole problem with primitives being different to reference types, we'll just ignore that for now.)

#### How do Scala and Java types compile down to classfiles?

The mapping from Java types to the JVM is easy -- the types are the same. This is because Java grew up in a pretty close with the JVM. There is very little in the JVM itself that isn't there to support some feature of Java, because for a long time Java was the only language worth mention that used the JVM. These days there are many more, and features like the `invokedynamic` instruction were added specifically for those others.

Scala has a less direct correspondence between its types and JVM classfiles. `trait`s compile to `interface`s if the have no implementation and only define API. This makes sense if you think about what is allowed in a Java `interface`. All other Scala types compile down to `class`es.

The fun really starts when looking at how inheritance in Scala (which allows multiple inheritance from types with behaviour, in the form of `trait`s) is implemented in the JVM type system (which does not). I might come back to address this in the future, but I left it out of scope of the talk, which was already growing too long!

#### How do Scala and Java class members compare?

There are two sorts of code that can be invoked in Scala or Java -- those on exist on an instance of some type and have access to its members (`this` reference, other fields), and those that have no such context other than global state. The difference between these two sorts of function is that the code for the second type exists in a single place, it has a statically-known address.

For the first kind, the method might have been overridden in a class hierarch, and to find the right code for the function attached to an instance, the hierarchy needs to be examined in some way. This is called a **virtual** function call.

Scala divides these two sorts of function by putting the first kind on `class`es or `trait`s, and the second kind on `object`s. (There are classfile differences that we will see later.)

Java calls the first kind instance methods, and the second kind must be marked with the `static` keyword.

The bytecode for Java is a pretty direct correspondence -- you see methods and fields, some of them are static. Scala has a more complex translation into classfiles, which we'll see in the next section.

***

{% include image-float.html src='/images/homer-just-because-i-dont-care.jpg' id='homer-just-because-i-dont-care' side='right' %}

## 2. What is bytecode?

First, why do we even care?

Don't expect to have to look at bytecode frequently. Usually (hopefully!) we can trust that the compiler has transformed your code into bytecode correctly. Most developers won't ever have to get into detail of the generated bytecode, and that's a good thing -- that's why we have higher-level languages!

But it does give some context as to what's happening, and having this context can give you an understanding of why certain optimisations are possible or not, and why some code runs blazingly fast while some limps along.

### Bytecode is a stack-based machine

Bytecode is the first intermediate step of the compilers that lead to the CPU. It's a language describing your code in a platform-independent way, in particular for a fictional platform.

It describes the execution of your program on a stack-based machine, as opposed to the register-based processors we're used to. Values are put on a stack; functions use those values as parameters and replace them with results.

It's not particularly efficient, but it's not supposed to be. We're still quite a long way from the metal.

{% include todo.html note='animation of stack example' %}

Here's an example of the steps of execution of a short code snippet:

{% highlight java %}"my favourite number is: " + (1 + 2){% endhighlight %}

1. first, the two integer values, 1 and 2, are added to the stack.
1. the `iadd` instruction to add two integers is invoked, and the result remains on the stack.
1. next we need to convert this integer 3 into a string that can be concatenated with the prefix `"my favourite number is: "`. The instruction here is `invokestatic String.valueOf`, which invokes this method with the parameter 3 and leaves the string `"3"` on the stack.
1. finally, add the longer string and run the instruction `invokevirtual String.concat`. The expected result is left on the stack.

Note the `static` and `virtual` instructions -- these have the same meaning as described above. The virtual call is because the String concatenation method "belongs" to the string on which it is called, and the static call has no such instance.

### Reading a classfile

{::options parse_block_html="true" /}
<div class="inline-image-right half-width">
{% highlight c %}javap -p -c <class-name>{% endhighlight %}
{% highlight scala %}
object ScalaConstants {
  val ichBinEinConstant = "some string"
  def ichBinEinUtilityFunction(param: Int) = param.toString
}
{% endhighlight %}
{% highlight java %}
Compiled from "ScalaConstants.scala"
public final class ScalaConstants$ {
  public static final ScalaConstants$ MODULE$;
  private final java.lang.String ichBinEinConstant;
  public static {};
  public java.lang.String ichBinEinConstant();
  public java.lang.String ichBinEinUtilityFunction(int);
  private ScalaConstants$();
}

public final class ScalaConstants {
  public static java.lang.String ichBinEinUtilityFunction(int);
  public static java.lang.String ichBinEinConstant();
}
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

The JDK ships with a disassembler app called `javap` that can display bytecode in a somewhat human-readable form.

We're going to use a trivial example to look at some bytecode. This example `ScalaConstants` contains a constant value and a utility function in an `object`, which is Scala's implementation of a singleton. Below it is the bytecode as shown by `javap -p ScalaConstants`, just the type signatures with no disassembled code, for now.

Notice first that **there are two classes**, one with a `$` appended to the name. This is synthetically generated by the Scala compiler, and is how singleton objects (and companion objects) are implemented. This is a sort of hidden type -- it's accessed only through the main type `ScalaConstants` that's declared in source.

Lines with parentheses represent methods, lines without represent fields. The `public static {}` is the class's static initialiser that runs when the class is loaded. In this case, when the static initialiser is called the constructor is run, and a new instance saved in the `MODULE$` field. This is the globally-visibile singleton instance.

{% include clearfix.html %}

#### Calling a method on an `object`

What happens when a method is invoked? Suppose we want to see what happens for `ScalaConstants.ichBinEinUtilityFunction(3)`. Let's **look at the bytecode** for the utility function, which we can get using `javap -c ScalaConstants`.

{% highlight java %}
public final class ScalaConstants {
  public static java.lang.String ichBinEinUtilityFunction(int);
    Code:
       0: getstatic     #16  // Field ScalaConstants$.MODULE$:LScalaConstants$;
       3: iload_0
       4: invokevirtual #18  // Method ScalaConstants$.ichBinEinUtilityFunction:...
       7: areturn
}
{% endhighlight %}

1. load the singleton `ScalaConstants$` object from the `static` field called `MODULE$` onto the stack
1. load the integer parameter onto the stack
1. invoke the instance method which, yes, has the same name as this function
1. return the String reference

What about inside the delegate function? From `javap -c ScalaConstants$`:

{% highlight java %}
public final class ScalaConstants$ {
  public java.lang.String ichBinEinUtilityFunction(int);
    Code:
       0: iload_1
       1: invokestatic  #26  // Method scala/runtime/BoxesRunTime.boxToInteger:(I)Ljava/lang/Integer;
       4: invokevirtual #29  // Method java/lang/Object.toString:()Ljava/lang/String;
       7: areturn
}
{% endhighlight %}

First note that this one doesn't have a `static` modifier -- it's an instance method on the singleton object.

1. load the integer parameter onto the stack.
1. turn the `int` primitive into an object.
1. invoke the `toString` method on the new object. This is a `virtual` call because it's a non-static method, called on an instance.
1. return the string reference.

The stack holds parameters to the method, as we saw. When calling a method _on an instance_, a non-static method, the zeroth parameter is `this`. You'll notice the difference when loading the `int` parameter in these last two examples, `iload_1` instead of `iload_0`.

#### Initialising a singleton `object`

{::options parse_block_html="true" /}
<div class="inline-image-right half-width">
{% highlight java %}
public final class ScalaConstants$ {
  public static final ScalaConstants$ MODULE$;
  private final java.lang.String ichBinEinConstant;

  public static {};
    Code:
       0: new           #2   // class ScalaConstants$
       3: invokespecial #12  // Method "<init>":()V
       6: return

  private ScalaConstants$();
    Code:
       0: aload_0
       1: invokespecial #28  // Method java/lang/Object."<init>":()V
       4: aload_0
       5: putstatic     #30  // Field MODULE$:LScalaConstants$;
       8: aload_0
       9: ldc           #32  // String some string
      11: putfield      #17  // Field ichBinEinConstant:Ljava/lang/String;
      14: return
}
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

One more example -- how does the singleton itself get initialised? Below is the initialisation code from the disassembled `ScalaConstants$` class.

`static {}` is the static initialiser that is run when the class is loaded. The code here creates the singleton object, invokes its constructor and returns.

Let's walk through the constructor of the class, `private ScalaConstants$()`:

* `aload_0` loads the `this` reference onto the stack, and then invokes the super-constructor. On construction every class runs its parent class constructor first, all the way up to the top type `Object`. That top type constructor has its own instruction, as we see here.
* The `this` pointer is loaded again, so that it can be written into the static field `MODULE$`.
* The `this` pointer is loaded again, followed by the string constant which is written into the `ichBinEinConstant` field on `this`.

{% include clearfix.html %}
{% capture java_singleton %}
#### Sidebar: Java and the Singleton Pattern

<div class="inline-image-left half-width">
{% highlight java %}
public Singleton {
  private static final class Holder {
    private static final Holder INSTANCE
      = new Holder();
    // singleton state here
  }

  // delegate to Holder.INSTANCE
  // from other methods here
}
{% endhighlight %}
</div>

Java has something of a troubled history with the singleton pattern, in particular with double-checked locking as an attempted optimisation. The insufficient memory model pre-Java 1.5 and a poor understanding of locking made it easy to have incorrectly or unsafely initialised singletons, that would present as rare and unexplainable bugs.

The accepted idiom these days is the holder-class pattern, which makes the singleton as lazy as possible but also allows the fastest possible access, with no synchronisation required. The instance is created when the class is loaded and all locking happens internally in the JVM.

The Scala `object` case is the simpler eager initialisation version, which doesn't need the extra indirection.

{% include clearfix.html %}
{% endcapture %}
{% include sidebar.html content=java_singleton %}

***

## 3. Benchmarking



***

{% include todo.html note='Still going!' %}

* `String.<method>` calls can be static-ised with CHA
* numbered lines, numbers `#16` in instructions

***

> Every problem in computer science is solved by an extra level of indirection

***

### Resources

* Slides for this talk _(todo)_
* Alexey Shipilev's blog, in particular his post on [Nanotrusting Nanotime](http://shipilev.net/blog/2014/nanotrusting-nanotime/)
