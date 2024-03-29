---
layout: post
title: Guava Testlib Example
description: a brief introduction to generated tests
long_description: "Step-by-step guide to using the Guava Testlib library for test case generation"
categories:
- post
tags:
- article
- software
- comments
- highlight
status: publish
type: post
author:
- Joe Kearney
---

{% include image-float.html src='/images/hacker-rank-testlib-junit.png' txt_alt='Hierarchy of generated tests in Eclipse JUnit view' caption='Hierarchy of generated tests' id='guava-generated-tests-in-eclipse' side='right' %}

Guava Testlib was written to test collections implementations exhaustively. It's general enough to allow tests to be written for any interface and have them run against many different implementations. It generates the cross product (filtered according to features) of tests and implementations and puts them in a nice hierarchy that looks great in Eclipse.

The example in the image here shows the tests I wrote for a few of my Hacker Rank [submissions](https://github.com/joekearney/hacker-rank). Problems that have more than one solution do not require the tests to be duplicated, and any common tests are easy to factor out to apply to all solutions. (This was a silly use of testlib, but was fun to put together nonetheless.)

Tests can be annotated with `Feature`s that correspond to differences in implementations of the interface specification -- the same set of tests can be used to test mutable and immutable collections, for example, and the framework will decide which tests to add to which suite.

[This project](https://github.com/joekearney/guava-testlib-example.git), described on this page, gives a simple and contrived example of how to set up these tests. We have a `Calculator` interface and various implementations that support some of the operations for some of the parameters.

{% include clearfix.html %}

> Check out the project on Github [here](https://github.com/joekearney/guava-testlib-example.git). This page walks through the bits that make up that project, so read through or skip to the whole thing.

This page doesn't go into any detail on derived test suites, where sub-test suites can be created recursively based on the test subject. There's a wealth of examples in the library itself around tests of collections and their derived collections (views, iterators, reserialised, etc).

***

## What's the big idea?

> Write tests against the interface. Run the generated test suite per implementation, with the set of features that your implementation supports.

***

## What are the components?

* `FeatureSpecificTestSuiteBuilder` -- this creates the test suite. Extend this, pass it a subject generator and call `createTestSuite`. This is where the set of tester classes is declared.
* `AbstractTester` -- extend this to provide actual tests. Test methods should be JUnit 3 style tests, not using `@Test` annotations. This class provides access to the subject generator. You might also want an abstract subclass from which your test cases extend if you want to give default assertion methods, for example.
* `TestSubjectGenerator` -- this is just a supplier of your implementation.

## Let's get started

We'll start with a really simple calculator interface. We can consider an implementation that uses `BigDecimal` to make accurate calculations, and an integer calculator that doesn't know about decimals and throws if passed anything other than an `Integer`. Or even a broken integer calculator that can't handle negative numbers.

{% highlight java %}
public interface Calculator {
  default Number add(Number a, Number b) { throw new UnsupportedOperationException(); }
  default Number multiply(Number a, Number b) { throw new UnsupportedOperationException(); }

  /** Converts some useful classes of {@link Number} to {@link BigDecimal}. */
  public static BigDecimal toBigDecimal(Number num) { ... }
}
{% endhighlight %}

The central part of the test framework is test suite builder that you need to write. The below is the trivial such builder. You can do all sorts of other things in here, from simple things like determining the name automatically from the generator, to creating more complex hierarchies of tests (see `TestsForSetsInJavaUtil`, for example).

{% highlight java %}
public class CalculatorTestSuiteBuilder extends
      FeatureSpecificTestSuiteBuilder<CalculatorTestSuiteBuilder, CalculatorTestSubjectGenerator> {
  @Override protected List<Class<? extends AbstractTester>> getTesters() {
    return ImmutableList.of();
  }
  public static CalculatorTestSuiteBuilder using(CalculatorTestSubjectGenerator generator) {
    return new CalculatorTestSuiteBuilder().usingGenerator(generator);
  }
}
{% endhighlight %}

As soon as we write any test classes we'll add those classes to the list returned from `getTesters`.

## Writing a first test

To start with, let's write a superclass for our test cases, which can contain the common assertions and functions that we'll want to use.

{% highlight java %}
public abstract class CalculatorTester extends AbstractTester<CalculatorTestSubjectGenerator> {
  protected static void assertEqualsExact(Number actual, long expected) {
    assertEqualsExact(toBigDecimal(actual), new BigDecimal(expected));
  }
  protected static void assertEqualsExact(Number actual, double expected) {
    assertEqualsExact(toBigDecimal(actual), new BigDecimal(expected));
  }
  protected static void assertEqualsExact(BigDecimal actual, BigDecimal expected) {
    assertTrue("Expected [" + expected + "] but got [" + actual + "]",
      actual.compareTo(expected) == 0);
  }
}
{% endhighlight %}

We'll divide the test cases by the separate features of the Calculator that we're testing.

{% highlight java %}
public class AddTester extends CalculatorTester {
  public void testAddZero() throws Exception {
    Number result = getSubjectGenerator().createTestSubject().add(0, 0);
    assertEqualsExact(result, 0);
  }
}
{% endhighlight %}

Now the test class can be added to the list of testers in the `CalculatorTestSuiteBuilder`:

{% highlight java %}
@Override protected List<Class<? extends AbstractTester>> getTesters() {
  return ImmutableList.of(AddTester.class);
}
{% endhighlight %}

## Running the tests

The builder builds the test suite for a subject generator that you provide. Here, all the generator has to do is to supply an instance the calculator.

{% highlight java %}
public class TestsForCalculators {
  public static Test suite() {
    TestSuite suite = new TestSuite("Calculators");

    suite.addTest(CalculatorTestSuiteBuilder.using(new CalculatorTestSubjectGenerator() {
        @Override public Calculator createTestSubject() {
          return new BigDecimalCalculator();
        }})
      .named("BigDecimalCalculator")
      .createTestSuite());

    return suite;
  }
}
{% endhighlight %}

Now you can just keep adding tests that are independent of the implementations.

## Features

Different implementations can have different features. If we know that a specific Calculator won't handle non-integers, or negative numbers, say, then the tests asserting behaviour around these features shouldn't be run. Even better, we should test that they throw `IllegalArgumentException` or some other consistent response.

Features are declared as an enum, and carry their own `@Require` annotation to determine which features are tested by which test cases. Most of this class is boilerplate setting, typed accordingly. The only interesting bit is the enum constants that you declare, and their implied features (passed as enum constructor arguments), which can be arbitrarily nested. See `CalculatorFeature` for the rest of the boilerplate.

{% highlight java %}
public enum CalculatorFeature implements Feature<Calculator> {
  POSITIVE_NUMBERS,
  NEGATIVE_NUMBERS,
  ANY_SIGN(NEGATIVE_NUMBERS, POSITIVE_NUMBERS),

  INTEGER_PARAMETERS,
  FLOATING_POINT_PARAMETERS,
  ANY_TYPE(INTEGER_PARAMETERS, FLOATING_POINT_PARAMETERS),

  GENERAL_PURPOSE(ANY_SIGN, ANY_TYPE),
  ;

  /* snip boilerplate */
}
{% endhighlight %}

Then, for example, a test case is annotated thus:

{% highlight java %}
@Require({CalculatorFeature.NEGATIVE_NUMBERS, CalculatorFeature.INTEGER_PARAMETERS})
public void testMinusOnePlusMinusOne() {
  Number result = getSubjectGenerator().createTestSubject().add(-1, -1);
  assertEqualsExact(result, -2);
}
{% endhighlight %}

and the test suites are constructed declaring the features implemented by each implementation. This one will generate a test suite that won't include the above test, for example.

{% highlight java %}
suite.addTest(CalculatorTestSuiteBuilder.using(new CalculatorTestSubjectGenerator() {
    @Override public Calculator createTestSubject() {
      return new PositiveIntegerCalculator();
    }})
  .named("PositiveIntegerCalculator")
  .withFeatures(CalculatorFeature.INTEGER_PARAMETERS, CalculatorFeature.POSITIVE_NUMBERS)
  .createTestSuite());
{% endhighlight %}

Note you can also annotate tests to run only if the feature is not implemented by a specific test subject, using `@Require(absent=CalculatorFeature.NEGATIVE_NUMBERS)`, for example.

***

## Next steps

* Our Calculators don't do much, we need to add implementations of other operations, such as multiply.
* Once we've got tests for new features, we could add them to the `Feature` enum. Test suites implementing a new `MULTIPLY` feature could be declared as such so that only those calculators that support it are tested.
* Tester classes can be annotated as well as methods, so we might annotate the `AddTester` class itself with `@Require(CalculatorFeature.ADDITION)`.
