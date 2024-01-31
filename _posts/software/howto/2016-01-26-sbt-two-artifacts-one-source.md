---
layout: post
title: "One Source, Two Jars"
description: "multiple builds for one project"
long_description: "How to build two artifacts from one source folder in SBT"
categories:
- post
tags:
- howto
- software
keywords:
- scala
- sbt
status: published
type: post
author:
- Joe Kearney
---

SBT has long been able to [cross compile](http://www.scala-sbt.org/0.13/docs/Cross-Build.html) code to multiple versions of Scala. What if you want to cross compile to different versions of a library?

In the case that came up today we're building a library that uses a Hadoop client library that has versions supporting v1 and v2 of the underlying MapReduce. We need to produce a version of our library that supports both MRv1 and MRv2.

## Problem

> Using SBT, compile and package the same source code twice, with two different sets of dependencies.

The solution is at the bottom, and in between are the steps that my colleague [Aaron Levin](http://aaronlevin.ca) and I went through to get there.

### Idea one: fake it

Can we just compile our code once, against (say) the newer version, and ship it, requiring our end users to provide the version of the dependency that they need?

The two versions of the Hadoop library have "[rare](https://www.cloudera.com/documentation/enterprise/latest/topics/cdh_ig_mapreduce_to_yarn_migrate.html)" source incompatibilities, meaning that we can't in good conscience build against only one version and ship it claiming support for both. **We need to compile both separately**, so that we get errors if we use something that is incompatible between versions, when something really is broken.

### Idea two: Ivy configurations

In Ivy dependency resolution, the system that SBT uses, a dependency has a notion of a [_configuration_](https://ant.apache.org/ivy/history/latest-milestone/ivyfile/configurations.html). You can specify that certain dependencies are to be used only for certain things. (That documentation is written for the Ivy XML configuration format, but the ideas are the same as its use in SBT.)

Most commonly this is used for _test_ libraries that you don't want on the default _runtime_ classpath of your project. Occasionally you'll have different _compile_-time dependencies to _runtime_, for example if you need to compile a tool for multiple database drivers, only one of which is used at runtime. There's also _provided_, which is used to indicate dependencies that are expected to be provided by something else at runtime, usually framework-ey things like Hibernate or servlet libraries.

By default in Ivy, the runtime configuration of the dependency is pulled into the runtime configuration of your build. You can declare that a dependency should be used in your project's test configuration like this in SBT:

{% highlight scala %}
libraryDependencies += "my.awesome" % "test.library" % "1.2.3" % "test"
{% endhighlight %}

Publishing multiple configurations that determine which dependency you want to use is an alternative to publishing multiple versions. Cloudera went with the latter approach for this library, and [published](https://maven-repository.com/artifact/org.apache.hadoop/hadoop-client) two versions called `2.6.0-mr1-cdh5.5.0` for MRv1 and `2.6.0-cdh5.5.0` for MRv2. I think deciding between exposing the two uses of our library as two versions or two configurations is a fairly even balance here, but that there are likely to be fewer problems and less confusion down the line if we stay consistent with what the Hadoop library chose.

So: could we have two configurations called `mr1` and `mr2` and publish them both? Yes, in principle, **but we still need to compile everything twice** and we haven't achieved that in a single build file yet.

### Idea three: two versions

{::options parse_block_html="true" /}
<div class="inline-image-right">
{% highlight scala %}
lazy val commonSettings = Seq(
  organization := "my.awesome",
  name := "hadoop.library",
  scalaVersion := "2.11.5",
  libraryDependencies ++= Seq( /* ... */ )
)
val projectVersion = "1.0.0"
lazy val projectForMr1 = (project in file("."))
  .settings(commonSettings: _*)
  .settings(
    version := s"${projectVersion}-mr1",
    libraryDependencies += "org.apache.hadoop"
      % "hadoop-client" % s"2.6.0-mr1-cdh5.5.0"
  )
lazy val projectForMr2 = (project in file("."))
  .settings // ... the same, but for mr2
{% endhighlight %}
</div>
{::options parse_block_html="false" /}

So we've decided we need to build everything twice. Easy in SBT, right? There are [instructions for multi-project builds](http://www.scala-sbt.org/0.13/docs/Multi-Project.html) and everything.

Nope. We want multiple projects over _the same_ project directory (the `file(".")` bit), but SBT doesn't support that. You can even try setting a project ID directly (`Project("mr1", file("."))`), but that doesn't help. It appears that **the directory determines the sub-project**.

Unfortunately SBT doesn't report any of this, it just silently discards the first declared sub-project in favour of the last.

The useful SBT command here, by the way, is `sbt show versions` to display the sub-projects and their configured versions.

<div class="clearfix"></div>

## Solution: two builds pointing to the same sources

We need **each of the sub-project builds to have its own directory**. The directory can be empty, it just has to exist. To avoid copying the source around, we could create symlinks all over the place, but a solution that does it all in the build itself means no need for extra setup.

The solution we've come to feels like a bit of a hack, but it works. Here it is:

* assign each sub-build to a directory name, which can even be hidden inside `target` to stay out of the way. SBT will create it, and put a sub-project specific `target` directory inside it.
* point the `scalaSource` setting for the sub-project to the original source directory, in the top level project. You have to do this for any of the conventional directory structure that you use (test, resources, etc)

With some additional refactoring to remove duplication, we get to something like the following.

{% highlight scala %}
lazy val commonSettings: _* = Seq(
  organization := "my.awesome",
  name := "hadoop.library",
  scalaVersion := "2.11.7",
  libraryDependencies ++= Seq( /* common dependencies */ ),

  /**
   * Define the scala sources relative to the sub-directory the project source. The
   * individual projects have their sources defined in `./target/${projectName}`,
   * therefore `./src` lives two directories above base. Also do this for `resources`
   * etc, if needed.
   */
  scalaSource in Compile := baseDirectory.value / ".." / ".." / "src" / "main" / "scala",
  scalaSource in Test    := baseDirectory.value / ".." / ".." / "src" / "test" / "scala"
)
val projectVersion = "1.0.0"
val hadoopClientVersion = suffix => s"2.6.0${suffix}-cdh5.5.0"

def generateProject(subProjectName: String, hadoopClientSuffix: Option[String]) = {
  val suffix = hadoopClientSuffix.getOrElse("")

  Project(subProjectName, file(s"target/${projectName}"))
    .settings(commonSettings)
    .settings(
      version := s"${projectVersion}${suffix}",
      libraryDependencies += "org.apache.hadoop"
        % "hadoop-client" % hadoopClientVersion(suffix)
    )
}
lazy val projectForMr1 = generateProject("mr1", Some("-mr1"))
lazy val projectForMr2 = generateProject("mr2", None)
{% endhighlight %}
