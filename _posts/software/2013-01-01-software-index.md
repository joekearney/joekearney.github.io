---
layout: layout
title: "Joe’s Mots on Software"
categories:
- index
tags:
- article
- software
- landing
permalink: /software-index
sitemap:
  changefreq: daily
  priority: 0.9

---

{% include index-listing-for-tag.html tag='software' title=site.software.tag_name description=site.software.tag_description header-only=true %}

{% capture c %}
{% include_relative about-me-software.md %}
{% endcapture %}

{{ c | markdownify }}


{% include short-toc-by-tag.html tag='software' numPosts='all' showDrafts='true' showOnlyArticles='false' showLongDescription='true' title="Posts" %}
