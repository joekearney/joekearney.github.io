---
layout: layout
title: "Das Jo(e)s"
categories:
- index
tags:
- das-jo-e
- landing
permalink: /das-jo-e-index

title_image_img: /images/jo-joe-brandenburg-gate.jpg

sitemap:
  changefreq: daily
  priority: 0.9
---

{% include index-listing-for-tag.html tag='das-jo-e' title=site.das-jo-e.tag_name description=site.das-jo-e.tag_description orderAscending=true showDrafts=true header-only=true %}

{% include post-header-image.html title_image_img="/images/jo-joe-brandenburg-gate.jpg" %}

{% include index-listing-for-tag.html tag='das-jo-e' title=site.das-jo-e.tag_name description=site.das-jo-e.tag_description orderAscending=false showDrafts=true listing-only=true showLongDescription=true %}
