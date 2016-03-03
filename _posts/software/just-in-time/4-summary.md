# What have we learned?

We've learned about **Java and Scala types**, a little about their similarities and differences. We looked at bytecode as the level of indirection allowing the JVM to implement "**write-once run-anywhere**". And we've seen **JMH** not only as a tool for microbenchmarking, but also as a way to investigate what the JVM is doing under the covers.

**Your code is a lie** -- there is such a distance between your IDE and your CPU that what goes in one end may scarcely resemble what actually runs. **The compiler is sneaky**, it implements a lot of optimisations that make our code fast. These optimisations are great in production, but can **make it difficult to benchmark** our code's performance in a meaningful way.

There's a lot going on that can look like magic. I hope that [this short series](/just-in-time) can strip away some of that to show some of the detail the sausage factory underneath.
