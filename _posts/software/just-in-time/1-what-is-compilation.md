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

## Types and classfiles

Bytecode is organised into classfiles, and one type is stored in each file. **What's a type**, in this context?

Languages express their types in different ways. Scala has three **kinds** of types: `object`s, `class`es and `trait`s; while Java has two: `class`es and `interface`s.

(**Aside**: counting kinds like this is at least reasonable, but the exact numbers depend on the details. Scala's `case class`es are just `class`es with some free sugar. Java's `enum`s are just `class`es too and annotations are really interfaces, at least at the classfile storage level, and though Java and the JVM have the whole problem with primitives being different to reference types, we'll just ignore that for now.)

### How do Scala and Java types compile down to classfiles?

The mapping from Java types to the JVM is easy -- the types are the same. This is because Java grew up in a pretty close with the JVM. There is very little in the JVM itself that isn't there to support some feature of Java, because for a long time Java was the only language worth mention that used the JVM. These days there are many more, and features like the `invokedynamic` instruction were added specifically for those others.

Scala has a less direct correspondence between its types and JVM classfiles. `trait`s compile to `interface`s if the have no implementation and only define API. This makes sense if you think about what is allowed in a Java `interface`. All other Scala types compile down to `class`es.

The fun really starts when looking at how inheritance in Scala (which allows multiple inheritance from types with behaviour, in the form of `trait`s) is implemented in the JVM type system (which does not). I might come back to address this in the future, but I left it out of scope of the talk, which was already growing too long!

### How do Scala and Java class members compare?

There are two sorts of code that can be invoked in Scala or Java -- those on exist on an instance of some type and have access to its members (`this` reference, other fields), and those that have no such context other than global state. The difference between these two sorts of function is that the code for the second type exists in a single place, it has a statically-known address.

For the first kind, the method might have been overridden in a class hierarch, and to find the right code for the function attached to an instance, the hierarchy needs to be examined in some way. This is called a **virtual** function call.

Scala divides these two sorts of function by putting the first kind on `class`es or `trait`s, and the second kind on `object`s. (There are classfile differences that we will see later.)

Java calls the first kind instance methods, and the second kind must be marked with the `static` keyword.

The bytecode for Java is a pretty direct correspondence -- you see methods and fields, some of them are static. Scala has a more complex translation into classfiles, which we'll see in the next section.
