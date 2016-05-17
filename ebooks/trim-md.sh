#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 <filename>"
  echo "Trims out the yaml front matter, adds '# <Title>', then prints the content"
  exit 1
fi

file=$1
title=$(egrep 'title: .*' $file | sed -r 's/^title: "?([^"]*)"?$/\1/')
subtitle=$(egrep 'description: .*' $file | sed -r 's/^description: "?([^"]*)"?$/\1/')

function toPrettyDate() {
  local fileWithDate=$1
  yyyy=${fileWithDate:0:4}
  mm=${fileWithDate:5:2}
  dd=${fileWithDate:8:2}
  MONTHS=(ZERO Jan Feb March April May June July Aug Sep Oct Nov Dec)
  echo "$dd ${MONTHS[$mm]} $yyyy"
}

basefile=$(basename $file)
prettyDate=$(toPrettyDate $basefile)
if [[ "$subtitle" != "" ]]; then
  byline="$prettyDate -- $subtitle"
else
  byline="$prettyDate"
fi

echo
# remove front matter
# add chapter title, subtitle
# remove HTML blocks
# remove liquid/jekyll blocks
# remove hyperlinks
# remove [^akaroa] links
awk '/---/{p++}p==2' $file | sed "s/---/# $title\n\n## ${byline}/" | sed '/^</,/^<\//d' | sed -r 's/^(\{%.*|.*%\})$//' | sed -r 's/\[([^]]*)\]\(.*\)/\1/g' | sed 's/\(.\+\)\[^akaroa\]/\1/g'
echo
