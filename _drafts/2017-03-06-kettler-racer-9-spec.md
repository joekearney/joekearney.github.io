---
layout: post
title: "Kettler Racer 9 Serial Protocol"
description: ""
meta_description: ""
categories:
- post
tags:
- article
- software
- comments
- draft
status: published
type: post
author: Joe Kearney
---

I recently bought a Kettler Racer 9 indoor bike, and quickly learned that it would be more difficult than planned to get numbers out of it, either into my Garmin or for recording. More on that later.

It has a custom serial protocol that it talks over Bluetooth and USB (though I have been unable to get the USB connection to work).

Here I want to describe how to get this ride data.

## Commands

The protocol a request-response.

| Command  |     Meaning    |    Response |
|---------:|----------------|-------------|
| `ID`     |     Bike ID    | `[A-Z0-9]+` |
| `ST`     |     Status     |   see below |
| `PW<nn>` | Set resistance |       `ACK` |

### Sending a command

Commands are CRLF delimited; send the command followed by `\r\n`.

## Status response

The response to the `ST` status command is a single line containing eight fields:

* **heart rate** in BPM
* **cadence** in RPM
* **speed** in km/h
* **distance** in units of multiples of 100m -- to convert to metres, multiply by 100
* ...
* **energy**
* **elapsed time** as `mm:ss`
* **power** in watts

`heartRate cadence speed distanceInFunnyUnits destpower energy timeElapsed realPower`
