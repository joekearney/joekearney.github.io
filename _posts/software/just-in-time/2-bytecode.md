{% include image-float.html src='/images/homer-just-because-i-dont-care.jpg' id='homer-just-because-i-dont-care' side='right' %}

First, why do we even care about bytecode?

Don't expect to have to look at bytecode too frequently. Usually (hopefully) we can trust that the compiler has transformed your code into bytecode correctly. Most developers won't ever have to get into detail of the generated bytecode, and that's a good thing -- that's why we have higher-level languages!

But it does give some context as to what's happening, and having this context can give you an understanding of why certain optimisations are possible or not, and why some code runs blazingly fast while some limps along.

## Bytecode is for a stack-based machine

Bytecode is the first intermediate step of the compilers that lead to the CPU. It's a language describing your code in a platform-independent way, in particular for a fictional platform.

It describes the execution of your program on a stack-based machine, as opposed to the register-based processors we're used to. Values are put on a stack; functions use those values as parameters and replace them with results.

It's not particularly efficient, but it's not supposed to be. We're still quite a long way from the metal.

Here's an example of the steps of execution of a short code snippet:

{% highlight java %}"my favourite number is: " + (1 + 2){% endhighlight %}

1. first, the two integer values, 1 and 2, are added to the stack.
1. the `iadd` instruction to add two integers is invoked, and the result remains on the stack.
1. next we need to convert this integer 3 into a string that can be concatenated with the longer prefix. The instruction here is `invokestatic String.valueOf`, which invokes this method with the parameter 3 and leaves the string `"3"` on the stack.
1. finally, add the longer string `"my favourite number is: "` and run the instruction `invokevirtual String.concat`. The expected result is left on the stack.

Note the `static` and `virtual` instructions -- these have the same meaning as described above. The virtual call is because the String concatenation method "belongs" to the string on which it is called, and the static call has no such instance.

## Reading a classfile

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

### Calling a method on an `object`

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

### Initialising a singleton `object`

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
## Sidebar: Java and the Singleton Pattern

<div class="inline-image-left">
{% highlight java %}
// Idiomatic lazy singleton pattern
public class Singleton {
  private static final class Holder {
    private static final Singleton INSTANCE
      = new Singleton();
    // singleton state here
  }

  private Singleton() {}

  public static Singleton getInstance() {
    return Holder.INSTANCE;
  }
}
{% endhighlight %}
</div>

Java has something of a troubled history with the singleton pattern, in particular with double-checked locking as an attempted optimisation. The under-specified memory model pre-Java 1.5 made it easy to have incorrectly or unsafely initialised singletons, that would present as rare and unexplainable bugs.

The accepted idiom these days is the holder-class pattern. The singleton object is created lazily, only when the singleton is actually accessed. This allows the fastest possible access, with no other synchronisation required. All locking happens internally in the JVM.

The Scala `object` case is the eager initialisation version, which doesn't need the extra indirection.

{% include clearfix.html %}
{% endcapture %}
{% include sidebar.html content=java_singleton %}

That's enough of an introduction to bytecode. The language compilers `scalac` and `javac` that compile to bytecode do some optimisation, including any language-specific things -- an often-cited example is transformation of string concatenation like `"a" + "b" + "c"` into a `StringBuilder` expression, which is much more efficient by saving repeated copying.

Most of the heavy lifting is done later, by the Just-in-Time compilers at runtime.
