---
layout: post
title: 'How to: SSH tunnel into a DMZ'
categories:
- post
tags:
- software
- howto
status: publish
author: Joe Kearney

title_image_img: /images/ssh-tunnel-diagram.png
title_image_alt: "Diagram of JMX over SSH into a DMZ"
---

There are already many guides on the internet about how to set up SSH tunnelling [[1]][2][[2]][3]. This one isn't nearly as detailed as some, but it has one thing going for it: a picture! We all love pictures.

It's really easy. It's a one-liner.

## Motivating use cases

I'm running a service in a DMZ on port 1234. I want to access this from my desktop in the internal network without opening another port in the firewall.

This is all required for accessing JMX on a Java process running in the DMZ. JMX over one tunnelled port turns out to be more complicated; there'll be another post about that.

## Prerequisites

We're going to assume that a competent sysadmin set up the DMZ. This means that

* very few ports are open through the firewall for connection into machines in the DMZ. We'll assume only that port 22 is open for SSH.
* in particular the port to which we want to connect, 1234, is not directly accessible from anywhere except the host on which it is listening.
* SSH TCP forwarding has probably been turned off

We shouldn't need to change any of the firewall or iptables setup.

How can you tell if SSH TCP forwarding is enabled? You might not need it anyway, but if the below doesn't work, get verbose logging with the `-v` switch and look for `open failed: administratively prohibited`. You'll have to get this enabled on the host in the DMZ. Persuade your sysadmin that this is ok by suggesting that they use iptables rules to block all ports to which you don't need access from outside the host, including 1234.

We're going to set up the tunnel on a host in the internal network, to which the client has access. (We'll use a port on the `app-server` that's different to the target port in the DMZ, just for clarity.)

## Get digging

This is the magic beans:

{% highlight shell %}
ssh -f -L app-server:1235:127.0.0.1:1234 -N user@web-server
{% endhighlight %}

This says:

* create a socket on `app-server` listening on port 1235
* send any traffic over SSH to `web-server`
* on `web-server`, send any traffic received through the tunnel to `127.0.0.1:1234`. This won't go through the firewall and won't be blocked by iptables rules.
* the `-N` means "don't run a command on the target host". If you don't have this switch, you'll just get a shell on `web-server`.
* the `-f` runs the tunnel in the background

That's it.

## Caveats

Obviously I take no responsiblity for your web security.

If an attacker gets a shell on your web server then they'll have access to the service whose port you've forwarded, because they can connect directly to it. Though if they get that far maybe you'll likely have bigger worries anyway.

You could consider running the tunnel only when you actually want access to the management agent, and killing it when you're done.

[1]: http://www.joekearney.co.uk/images/ssh-tunnel-diagram.png
[2]: http://www.revsys.com/writings/quicktips/ssh-tunnel.html "SSH Tunneling Made Easy By Frank Wiles"
[3]: http://sgros.blogspot.co.uk/2011/11/tunneling-everything-with-ssh-or-how-to.html "Tunneling everything with SSH... or how to make VPNs..."
