---
layout: post
title: 'JMX in a DMZ'
categories:
- post
tags:
- software
- howto
status: publish
type: post
author: Joe Kearney
---
We want to manage a Java web server running in a DMZ using JMX. Here we describe how to set this up, with JMX access from clients over SSH. My [last post describes][1] how to set up connect to a port in the DMZ through an SSH tunnel (yes, it's simple). Once we have that, JMX-managed apps can be configured to allow JMX clients to connect to the source-host of the tunnel.

This post is in part a distillation of information found in Oracle blog posts [[1]][2][[2]][3] from 2007/8 with some contributions from [this one][4], and some of my own trial-and-error testing.

## How are JMX connections established?

1. Managed application starts an RMI registry and binds JMX connection details in it under the name `jmxrmi`
2. Client asks the RMI registry in the managed application for JMX connection details
3. RMI registry responds with `java.rmi.server.hostname:jmxPort` (from below)
4. Client connects to whatever host:port it was given

## Two ports

You can probably persuade your friendly but stubborn sysadmin to open one (outbound) port through the firewall, but a second will be tricky. A standard JMX config uses two ports:

1. **RMI registry**
    * specified by the `com.sun.management.jmxremote.port` system property
    * or given explicitly in `LocateRegistry.createRegistry(specifiedPort)`
2. **Used to export JMX RMI connection objects**
    * dynamically allocated when the JMX connection server is created
    * served to clients who ask the RMI registry for it

Usually you don't need to know the dynamic port used here until runtime, but obviously this isn't going to fly when connecting through a well-secured firewall.

You can specify that the connection server factory should use the same port for these two roles when creating the JMX connection server programmatically in the `JMXServiceURL`, for example:

{% highlight shell %}
service:jmx:rmi:///jndi/rmi:///jmxrmi
{% endhighlight %}

Here the first port is that used for exported JMX RMI connection objects and the second port is where the RMI registry listens. The value of `jmxHost` here is ignored always.

## Three addresses

There are many addresses that can be configured in various places.

1. The system property `java.rmi.server.hostname` ([Oracle docs][5]). Contrary to some writings, this has nothing to do with where any listeners are established, so this can basically anything. This is the address that clients are given by the RMI registry, to which they attempt to make JMX connections. **So this should be the name of the host originating the SSH tunnel.**
2. `jmxHost` in the `JMXServiceURL`, which is **always ignored**
3. `rmiHost` in the `JMXServiceURL` has to be **resolvable by the managed application**. Setting this to be 127.0.0.1, localhost or the machine name all appear to do the same thing, namely to bind to all interfaces on the machine.
4. If the JMX/RMIConnectorServer is created and bound into the RMI registry manually, you'll specify the host in new instance of `JMXServiceURL`. In that case the `rmiHost` above is ignored.

## Points of sadness

Nowhere with this relatively simple setup can you define the bind address of the RMI registry; it always seems to bind to `0.0.0.0`. Still, you can use iptables to prevent access to the port except from that host, and the SSH tunnel will do the rest.

The `java.rmi.server.hostname` property is defined VM-wide; it's not respected if passed in as the new connector server's environment. So this might not be appropriate for applications using RMI in other ways. Though if you're already running an app in a DMZ and using RMI to connect home, either you already know that and have solved these problems, or you're completely insane.

[1]: /posts/jmx-ssh-tunnelling-into-a-dmz/ "SSH tunnel into a DMZ"
[2]: https://blogs.oracle.com/jmxetc/entry/jmx_connecting_through_firewalls_using "Oracle: JMX - connection through firewalls"
[3]: https://blogs.oracle.com/jmxetc/entry/java_5_premain_rmi_connectors "Oracle - RMI Connectors, Single Port, SSL, and Firewall"
[4]: http://blog.markfeeney.com/2010/10/jmx-through-ssh-tunnel.html "Mark Feeney - JMX through a ssh tunnel"
[5]: http://docs.oracle.com/javase/7/docs/technotes/guides/rmi/javarmiproperties.html "Oracle - java.rmi properties documentation"
