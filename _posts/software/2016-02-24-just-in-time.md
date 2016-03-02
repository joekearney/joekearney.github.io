---
layout: post
title: "Just In Time"
description: "introduction to JVM compilation"
meta_description: "An introduction to compilation for the JVM, bytecode and JIT compilation, and benchmarking with JMH"
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

{% include image-float.html src='/images/xkcd-303-compiling.png' href='https://xkcd.com/303/' id='xkcd-compiling' side='left' caption="Compiling is, of course, what happens while you're sword-fighting on office chairs" %}

Compiling is the process of going from **human-readable code to executable instructions** that can run on a processor. These days there are many stages to this. If you watch closely enough you can see the Scala compiler going through many different phases during compilation of Scala code to JVM bytecode, and that's just the first step, getting to the JVM's **intermediate representation**.

Why not just compile straight to machine code, skipping this intermediate step? There are a lot of reasons for this. Primarily, this intermediate step is how Java implements its "write once, run anywhere" policy -- it's a level of indirection that allows the same source code to be translated eventually into machine-specific instructions, whether a laptop, phone or data-centre blade.

But the fact that ultimate compilation is deferred until runtime has other benefits too -- it allows the compiler to **use runtime information to guide optimisation** of the code. Hotspot was originally shipped with a description of "just-in-time compilation **with adaptive optimisation**". At runtime your code generates a lot of information about how it is used, about distribution of parameters, hot-spots (geddit?) of code that could benefit from more aggressive optimisation. It's a profiler that automatically tunes your code.

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
<div class="inline-image-right">
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

The **stack holds parameters** to the method, as we saw. When calling a method _on an instance_, a non-static method, the zeroth parameter is `this`. You'll notice the difference when loading the `int` parameter in these last two examples, `iload_1` instead of `iload_0`.

#### Initialising a singleton `object`

{::options parse_block_html="true" /}
<div class="inline-image-right">
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

<div class="inline-image-left">
{% highlight java %}
public class Singleton {
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

Java has something of a troubled history with the singleton pattern, in particular with double-checked locking as an attempted optimisation. The under-specified memory model pre-Java 1.5 made it easy to have incorrectly or unsafely initialised singletons, that would present as rare and unexplainable bugs.

The accepted idiom these days is the holder-class pattern, which makes the singleton as lazy as possible but also allows the fastest possible access, with no synchronisation required. The instance is created when the class is loaded and all locking happens internally in the JVM.

The Scala `object` case is the simpler eager initialisation version, which doesn't need the extra indirection.

{% include clearfix.html %}
{% endcapture %}
{% include sidebar.html content=java_singleton %}

That's enough of an introduction to bytecode. The language compilers `scalac` and `javac` that compile to bytecode do some optimisation, including any language-specific things -- an often-cited example is transformation of string concatenation like `"a" + "b" + "c"` into a `StringBuilder` expression, which is much more efficient by saving repeated copying.

Most of the heavy lifting is done later, by the Just-in-Time compilers at runtime.

***

## 3. Benchmarking

We like our code to run fast, and the compiler helps this to happen with a lot of just-in-time optimisations.

Sometimes we want to measure how fast our code runs, or compare different possible implementations looking for the fastest. This type of measuring is usually done on small scales -- **microbenchmarking** is the practice of isolating small blocks of code to measure their runtime. By removing complexity and only benchmarking a small portion of code we aim to improve measurement, but the fact is that we're now running code in a very different context to where it will eventually run.

The relative simplicity of code not running in a production environment means that the compiler can find many more optimisations to perform when compiling the code. In doing this the compiler can make changes that vastly change what the code is doing, to the extent that we're no longer measuring anything useful.

> Compiler optimisations can be a huge benefit at runtime; they can be a huge problem in benchmarking.

In this third section we'll look at just-in-time compilers. These run in the JVM, and transform the intermediate classfiles/bytecode into actual CPU instructions. I'm going to introduce some of the compiler optimisations that can be performed by looking at benchmarking, in particular with the **Java Microbenchmarking Harness**, JMH.

Benchmarking is an instructive way to learn about the JIT in the JVM because you need a certain understanding of what's going in order to convince yourself that you're actually measuring what you think you're measuring.

JMH is a benchmarking tool that aims to handle some of the complexity around measuring correctly. It times invocations of your code, taking averages from many runs; it handles requirements like warming up the JVM; and it provides help for **preventing certain optimisations** that would spoil your measurements.

There are a lot of articles around about JMH, but the advice presented in them can be often boiled down to the following:

* read the [samples](http://hg.openjdk.java.net/code-tools/jmh/file/tip/jmh-samples/src/main/java/org/openjdk/jmh/samples/), which cover a lot of the pitfalls
* some general advice about pitfalls of which you need to be aware (such as only benchmark operations in steady states, looping is generally discouraged inside benchmarks, ...)
* results will vary between runs
* you have to analyse benchmarks to understand the results, you shouldn't just take the results at face value

Benchmarking is for **comparing implementation choices**. It's not correct to conclude that a benchmark showing that some code runs in 20 nanoseconds in a synthetic benchmark will run in that time in production, surrounded by all manner of other context and under a different pattern of load.

### Writing benchmarks

<div class="inline-image-right">
{% highlight scala %}
class BenchmarkSomething {
  @Benchmark
  def wellHelloThere() {
    // code here is timed
  }
}
{% endhighlight %}
</div>

Writing the code for a benchmark is pretty straightforward -- you put the code you want to run in a method marked with `@Benchmark`. With sbt it's also easy to run, with `sbt jmh:run`.

One practical note: **JMH isn't set up to run inside another project**, in the way that you would do for unit tests. Rather than having benchmarks in a folder inside your project, it's usual to keep them external and either depend on the code you want to benchmark or write it as a one-off exploratory project.

When you run this, it generates the benchmark code for you, and there's quite a lot of it. Indeed it can be pretty instructive to have a look at it for yourself.

### 1. Is compiling worth it?

<div class="inline-image-left">
{% highlight scala %}
def target_default: Unit = ()
@CompilerControl(CompilerControl.Mode.EXCLUDE)
def target_interpreted: Unit = ()

@Benchmark
def compiled: Unit = target_default
@Benchmark
def interpreted: Unit = target_interpreted
{% endhighlight %}
</div>

JMH allows control over all sorts of JVM configuration. One JVM option exposed is compiler flags, which include the ability to selectively exclude methods from compilation, forcing them to be interpreted instead.

| Benchmark | time/invocation |
| --- | ---: |
| compiled | 2.3ns |
| interpreted | 89.5ns |
{: class="table table-bordered table-condensed table-striped width-initial inline-image-right"}

The example here is the most trivial one, compiling or interpreting a no-op method. We can see the difference clearly; the compiled method runs around 40 times faster than the interpreted method.

{% include clearfix.html %}

### 2. What's the cost of method invocation?

<div class="inline-image-right">
{% highlight scala %}
@CompilerControl(CompilerControl.Mode.DONT_INLINE)
def target_dontInline: Unit = ()
@CompilerControl(CompilerControl.Mode.INLINE)
def target_inline: Unit = ()

@Benchmark
def dontInlineBench: Unit = target_dontInline
@Benchmark
def inlineBench: Unit = target_inline
{% endhighlight %}
</div>

We can force the compiler to inline, or not to inline, a given method. In this benchmark we can test the overhead of invoking a method.

Again the result is clear, and in this example the overhead of the method call is around 2ns per invocation.

The JVM has a default maximum size for a method to be allowed to be inlined, which defaults to 35 bytes. You can change this, but it's not recommended without a really good reason and some evidence. Why shouldn't everything be inlined? Inlining makes for bigger methods that take longer to be compiled, for smaller benefit given that in larger methods the time spent invoking other methods is relatively smaller.

| Benchmark | time/invocation |
| --- | ---: |
| not inlined | 2.3ns |
| inlined | 0.3ns |
{: class="table table-bordered table-condensed table-striped width-initial inline-image-left"}

Note that inlining of methods that you get on the JVM usually only happens in JIT, not in `scalac` or `javac`. This allows stack traces to include the full call stack, for example. A notable exception to this is the Scala [`@inline` annotation](http://www.scala-lang.org/api/2.11.7/#scala.inline), which "requests that the compiler should try especially hard to inline the annotated method".

{% include clearfix.html %}

### 3. Dead code elimination

<div class="inline-image-left">
{% highlight scala %}
var x = Math.PI
@Benchmark
def measureLogWrong: Unit = { Math.log(x) }
@Benchmark
def measureLogRight: Double = Math.log(x)
{% endhighlight %}
</div>

Code that produces a value that isn't used is code that's just burning CPU unnecessarily. At runtime, it's great for unused code to be removed, because removing it makes our code better. In a benchmark, sometimes you have to persuade the compiler that your code isn't useless, otherwise your benchmarks give the wrong results.

Suppose that we want to measure a utility function like `Math.log`. If the compiler thinks that the value returned is not used then it is free to remove the call. It's easy to construct a benchmark method that "suffers" from this optimisation. JMH has support for preventing in the form of a type called `BlackHole` -- stuff goes in and doesn't come out. Any value returned from a benchmark method is consumed by a `BlackHole` and it's possible to access one for use inside the method as well. BlackHole goes to great lengths to ensure that the compiler cannot prove that the value is unused, while doing this quickly and with predictable performance.

| Benchmark | time/invocation |
| --- | ---: |
| code eliminated | 0.3ns |
| code runs | 21.8ns |
{: class="table table-bordered table-condensed table-striped width-initial inline-image-right"}

Note that the first example here doesn't return the value -- it's a `Unit` method and the compiler can easily show that the value is not used. (It also needs to know that there are no side-effects, which is likely easy to do with a native operation like `log` but may be harder with others.) The second version returns the value, and JMH will consume it for us.

The first version runs much faster, a result of <abbr title="dead code elimination">DCE</abbr>, but the second is the measurement we're actually interested in.

{% include clearfix.html %}

### 4. Parameter specialisation

<div class="inline-image-right">
{% highlight scala %}
var x = Math.PI
@Benchmark
def measureLogConst: Double = Math.log(Math.PI)
@Benchmark
def measureLogParam: Double = Math.log(x)
{% endhighlight %}
</div>

If the compiler can prove that the input to a function is always the same, then it can use this fact to assist in optimisations. If the parameter to a function is always the same value then this value can be loaded directly onto the stack without having to read its value from a field on each invocation.

| Benchmark | time/invocation |
| --- | ---: |
| constant param | 3.1ns |
| varying param | 21.8ns |
{: class="table table-bordered table-condensed table-striped width-initial inline-image-left"}

We can see that here, where in the first example the value is provably constant. In the second example, having the value come from a `var` is enough to force the compiler not to make this optimisation. The difference here is indeed so great that we might suspect more is going on that only eliminating a load of a value from a field.

{% include clearfix.html %}

### 5. Class hierarchy analysis

In a hierarchy of inheriting types with methods that override other methods, actual code for operations is distributed around in different types. Given an instance of some interface or trait, how do you find which code you need to run for a method call?

#### Quick intro: runtime types

To answer this fully we need a basic understanding of how the JVM represents objects and types at runtime. Any object has a concrete type, and that type is represented by a type descriptor in memory describing its methods, its one super-class and any super-interfaces, among other things. Each object has a pointer in memory to its type descriptor. This type descriptor is never an interface, it's always a class; **you can't instantiate an interface**, you always need some concrete type.

You can see and manipulate representations of these types using reflection; in Java, `<your-type>.class` or `<your-object>.getClass()` gives a `Class` object that exposes details of hierarchy, methods and fields available. (Fun fact: if you look closely enough in the JVM you'll discover that these things are called `klass`, to disambiguate from the Java-level keyword.)

Consider an example type hierarchy with an interface `List` and three implementations `ArrayList`, `LinkedList` and `ImmutableList`. In code you might have a reference to an object of type `List`, and polymorphism being a pillar of something means that the object will be one of the three sub-types, but can be treated generically.

{::options parse_block_html="true" /}
<div class="inline-image-right">
{% highlight java %}
// bytecode for method call list.size()
aload_1            // load list onto stack
invokevirtual #28  // Method List.size:()I
// now the integer size is on the stack
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

Suppose that we want to call a method `.size()` on our list. By the time this is compiled to bytecode it will look something like this. The method being called is on the interface, but the object on the stack has a concrete type and the code for the method has to be chosen based on the actual object, not the interface.

Doing this requires a few hops in memory:

* find the actual object (follow pointer from object reference to the actual object)
* find the object's concrete type (follow pointer from object header to its class)
* this class has a pointer to where the actual code of the method, which we can now invoke. (This is similar to a _vtable_ in other settings.)

Note we traverse _up_ the class hierarchy, not down. This is because **each object is an instance of a single concrete type**, and tracing up instead of down means we find method overrides.

Do we need all of these pointer dereferencing steps? In the usual case, the answer is yes. The code is compiled to handle calling methods polymorphically, so must look up the object header first.

This isn't the case for static methods, where the location of the code is known at compile time because there's no overriding (compare this to static vs dynamic linking of libraries). This is the difference between the `invokevirtual` and `invokestatic` instructions -- the latter doesn't need to dereference an object in order to be invoked.

Now consider the case where there's only one implementation of an interface method in the JVM -- when the method is **monomorphic, not polymorphic**. The just-in-time compiler is able to optimise method calls where the code of the method is statically known, using **class hierarchy analysis**. In our example, if only one implementation of `List` exists in the JVM then the object dereference can be skipped and the method call be made effectively `static`.

#### The benchmark

<div class="inline-image-left">
{% highlight scala %}
trait ThingA { def get: Int }
trait ThingB { def get: Int }

class ThingA1(value: Int) extends ThingA {
  def get = value
} // ... and other copies
class ThingB1(value: Int) extends ThingB {
  def get = value
}
// all different types
val a1: ThingA = new ThingA1(1)
val a2: ThingA = new ThingA2(2)
val a3: ThingA = new ThingA3(3)
val a4: ThingA = new ThingA4(4)
// all same type
val b1: ThingB = new ThingB1(1)
val b2: ThingB = new ThingB1(2)
val b3: ThingB = new ThingB1(3)
val b4: ThingB = new ThingB1(4)

@Benchmark
def multipleClasses = a1.get + a2.get + a3.get + a4.get
@Benchmark
def singleClass     = b1.get + b2.get + b3.get + b4.get
{% endhighlight %}
</div>

Can we observe this effect in practice? Certainly! `List` is a poor choice for this because many implementation of it will be loaded just by accident. So we'll construct a synthetic hierarchy to do this.

The code for both traits and all implementing classes is the same, so that we can test the difference when the only change is the number of implementations.

We've got four instances of `ThingA` of four different concrete types, and four instances of `ThingB` all of the same type. In the benchmark we'll load an integer from each of the four instances and add them together. This ensures that none of method calls are removed by the optimiser.

| Benchmark | time/invocation |
| --- | ---: |
| multiple classes | 5.3ns |
| single class | 3.6ns |
{: class="table table-bordered table-condensed table-striped width-initial inline-image-right"}

{% include clearfix.html %}

This effect has caused changes in code in the wild. The `ImmutableList` implementation in Google Guava, a set of core library extensions for Java, once had specialised implementations for small list sizes, but the effect of the method call overhead was discovered to be greater than the benefit given by these specialisations.

You can imagine why it could have been easy to miss this kind of performance difference in testing. In a typical benchmark you'd test each implementation (empty, one item, two items, ...) separately, and CHA would optimise method calls for you. In production code where you'd expect all of these types to be loaded, the opportunity for the JIT to perform these optimisations would much less.

### See the generated assembler

Why believe me?

So far I've offered explanations for the performance differences in our benchmark examples without providing a lot of evidence. JMH provides tools for inspecting the code generated by the JIT compiler.

#### A word of warning

It can be tricky to get this stuff set up. Some things that bit me include:

{% include todo.html note='add links, make this a sidebar?' %}

* the `hsdis` plugin for the Java runtime must be installed. It can be difficult to find pre-compiled binaries, but the Kenai project makes these available
* install `perf`, a Linux performance tool, it's supposed to be easy -- just install the `linux-tools`. I had trouble with kernel version mismatches.
* you can't do any of this on a Mac, because `perf` is very much Linux-specific. Worse, you can't do this on a Linux VM on a Mac; Virtualbox doesn't expose the required instrumentation from the hardware.

{% include clearfix.html %}
***

{% include todo.html note="asm for param specialisation example?" %}

***

### Resources

* Slides for this talk _(todo)_
* Alexey Shipilev's blog, in particular his post on [Nanotrusting Nanotime](http://shipilev.net/blog/2014/nanotrusting-nanotime/)
