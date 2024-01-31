---
layout: post
title: "Competitive Baby Metrics"
description: "results are in"
long_description: "My little brother won, the hive mind averaged out to an exceptionally good score, and I got to play with some inconsequential data while Eleanor had a nap. But first, poo."
categories:
- post
tags:
- das-jo-e
- article
status: publish
type: post
published: true
author:
- Joe Kearney

#title_image_float_right_url: /images/ellie/ellie-santa-hat.jpg
#title_image_float_right_text: Eleanor Margot Kearney, day 3
---

[new-tiny-human]: /posts/new-tiny-human
[predictive-baby-metrics]: /posts/predictive-baby-metrics

There's something disquieting about the magnitude of the force behind a poo that comes out of a [baby][new-tiny-human]. Even though she fits entirely on one arm, the _THUD_ of expelled stool striking nappy is extraordinary. It's often accompanied by a transition from red, contorted, angry face, to a look of supreme innocence and calm.

Our midwife introduced to a particularly evocative German word: _Spritzkaka_. Well, we haven't seen the poo go up the walls yet, but some of these more powerful episodes have managed to dirty not only the nappy, but also her chest, her back and all of her clothes. Naturally, in the course of changing all her clothes, she gets it all over her hands and feet too, and hence a total failure of containment.

Anyway, where were we?

## Results of the sweepstake

The results are in for the [sweepstake][predictive-baby-metrics] and there are both clear winners and losers.

No-one guessed Eleanor as a name, meaning everyone's scores are negative.

Only two scored single figures: Jo S came second with -9.36 points, pipped to the win by my brother **Robin K** with -5.4. Congratulations! I promise we didn't give any extra clues either to family members or namesakes!

It looks a lot like Jo went for averages in her choices, like the good statistician she is, and it almost paid off. Dr Robin clearly had all that industry knowledge to help...

At the other end of the scores, a special mention has to go to **Great Auntie Christine**, scoring an impressive -56.9 points, with a prediction for height (71cm, 28in) that we believe would be in the region of a world record for baby length. We'll put it down to a miscommunication, but we enjoyed it too much to ask for a correction!

Future work might (hint: probably won't) look into the optimisation questions that arise from closing to new entries only when we went into labour -- when is the optimum time to enter? Leighton will be pleased to hear that he took the honour of the last entry before the competition closed, not that it helped his 42nd place and -30 points.

## How did the "average" prediction do?

I was curious to know whether the hive mind of our friends and family would do any better at predicting Eleanor's birth than any individual entry. What happens if we take the average of all of the entries?

{% include image-float.html kind="iframe" width="269" height="296.5" src='https://docs.google.com/spreadsheets/d/e/2PACX-1vTQiaH7QQ-shk2V3x3gu-iA3pMBbSkZcXf_q0uUYJqgZ-oFujm5jsyd9aCWo7c4RgfaGhccewsAkTKr/pubchart?oid=468954778&amp;format=interactive' caption='Averaging birth time of day' id='birth-time-of-day-chart' side='right' %}

Averaging the time of birth was a little tricky, because you want to take into account that a clock is circular, rather than single interval in time. As an example, the average of 11pm and 1am should be midnight, not midday. To do that properly you represent the times as vectors around a circle, take the average of those, and use the angle of the result. In the middle of chart, we see the "average" dot about half way between midnight at the top and 6am to the right.

Taking the mean for the rest of the choices, from our final sample size of 47 we get

* **date** 27 December
* **time** 03:04
* **sex** girl (53%)
* **length** 51cm
* **weight** 3.42kg
* **name** mode "Jo" (of course)

The hive mind gets a surprisingly high total score of **-8.1 points**, which would be enough to drop into 2nd place! Good work, team, and a fine introduction to Monte Carlo simulation.

## Dataset

In the spirit of open data and reproducibility, here's the full, anonymised dataset!

* [name suggestions](https://docs.google.com/spreadsheets/d/e/2PACX-1vTQiaH7QQ-shk2V3x3gu-iA3pMBbSkZcXf_q0uUYJqgZ-oFujm5jsyd9aCWo7c4RgfaGhccewsAkTKr/pubhtml?gid=741876496&single=true) with counts (yes, most of them are "Jo")
* [csv of all entries](https://docs.google.com/spreadsheets/d/e/2PACX-1vTQiaH7QQ-shk2V3x3gu-iA3pMBbSkZcXf_q0uUYJqgZ-oFujm5jsyd9aCWo7c4RgfaGhccewsAkTKr/pub?gid=2022689314&single=true&output=csv) to the sweepstake, normalised to CET, kg, cm, first suggested name

***

<iframe width="100%" height="400px" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTQiaH7QQ-shk2V3x3gu-iA3pMBbSkZcXf_q0uUYJqgZ-oFujm5jsyd9aCWo7c4RgfaGhccewsAkTKr/pubhtml?gid=2022689314&amp;single=true&amp;widget=true&amp;headers=false"></iframe>
