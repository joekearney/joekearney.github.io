<h2 class="title-colour">Stage Reports</h2>

Here are the facts and figures for each stage, with a report post from after each day.

<ul class="listing">
{% for stage in site.data.haute-route %}

{% comment %} Find report post for this stage {% endcomment %}
{% for stage_post in site.tags.haute-route-stage-report %}
{% if stage_post.stage-number == stage.number %}
{% assign stage_report_summary = stage_post.meta_description %}
{% assign stage_report_gc = stage_post.haute-route-gc-position %}
{% assign stage_report_place = stage_post.haute-route-stage-position %}
{% endif %}
{% endfor %}

{% include_relative haute-route-stage-summary-element.html stage_strava=stage.strava-route stage_number=stage.number stage_date=stage.date stage_title=stage.title stage_cols=stage.cols stage_description=stage.description stage_length=stage.length stage_ascent=stage.ascent stage_report_summary=stage_report_summary stage_report_gc=stage_report_gc stage_report_place=stage_report_place %}
{% endfor %}

{% for p in site.tags.haute-route-closing-thoughts-post %}
{% include toc-listing-element.html post_id=p.id showLongDescription="true" title_class="h4" %}
{% endfor %}
</ul>
