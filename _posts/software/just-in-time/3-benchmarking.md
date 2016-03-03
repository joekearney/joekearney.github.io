# 3. Benchmarking

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

## Writing benchmarks

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

## 1. Is compiling worth it?

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

## 2. What's the cost of method invocation?

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

## 3. Dead code elimination

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

## 4. Parameter specialisation

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

## 5. Class hierarchy analysis

In a hierarchy of inheriting types with methods that override other methods, actual code for operations is distributed around in different types. Given an instance of some interface or trait, how do you find which code you need to run for a method call?

### Quick intro: runtime types

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

### The benchmark

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

## See the generated assembler

Why believe me?

So far I've offered explanations for the performance differences in our benchmark examples without providing a lot of evidence. JMH provides tools for inspecting the code generated by the JIT compiler.

{% capture hsdis_warning %}
### A word of warning

It can be tricky to get this stuff set up. Some things that bit me include:

* the `hsdis` plugin for the Java runtime must be installed. It can be difficult to find pre-compiled binaries, but the [Kenai project makes these available](https://kenai.com/projects/base-hsdis/downloads)
* install `perf`, a Linux performance tool, it's supposed to be easy -- just install the `linux-tools`. I had trouble with kernel version mismatches.
* you can't do any of this on a Mac, because `perf` is very much Linux-specific. Worse, you can't do this on a Linux VM on a Mac; Virtualbox doesn't expose the required instrumentation from the hardware.
{% endcapture %}
{% include sidebar.html content=hsdis_warning %}
