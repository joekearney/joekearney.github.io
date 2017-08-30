<ul class="listing">
{% for stage in site.data.haute-route %}
{% include haute-route-stage-summary-element.html stage_strava=stage.strava-route stage_number=stage.number stage_date=stage.date stage_title=stage.title stage_cols=stage.cols stage_description=stage.description stage_length=stage.length stage_ascent=stage.ascent %}
{% endfor %}
</ul>
