#!/usr/bin/env bash

set -euo pipefail

function echoErr() {
  cat <<< "$@" 1>&2
}

echoErr "Starting trim"

if [ $# -ne 1 ]; then
  echoErr "Usage: $0 <filename>"
  echoErr "Trims out the yaml front matter, adds '# <Title>', then prints the content"
  exit 1
fi

file=$1
echoErr "Trimming: $file"
basefile=$(basename "$file")

function extract() {
  local field="$1"
  echoErr "    Looking for field: $field"
  yq --front-matter=extract ".$field" < "$file"
}

function extract_array() {
  local field="$1"
  local join="$2"
  echoErr "    Looking for field: $field"
  yq --front-matter=extract ".$field | join(\"$join\")" < "$file"
}

# title=$(grep -e 'title: .*' "$file" | sed -r 's/^title: "?([^"]*)"?$/\1/')
# subtitle=$(grep -e 'description: .*' "$file" | sed -r 's/^description: "?([^"]*)"?$/\1/')
# author=$(grep -e 'author: .*' "$file" | sed -r 's/^author: "?([^"]*)"?$/\1/')

title=
subtitle=
author=

title="$(extract "title")"
subtitle="$(extract "description")"
author="$(extract_array "author" ", ")"

echoErr "  title[$title] -- subtitle[$subtitle]"
echoErr "  author[$author]"

# if [[ "$author" == "" ]]; then
  # exit 1
# fi

function toPrettyDate() {
  local fileWithDate=$1
  yyyy=${fileWithDate:0:4}
  mm=${fileWithDate:5:2}
  dd=${fileWithDate:8:2}
  MONTHS=(ZERO Jan Feb March April May June July Aug Sep Oct Nov Dec)
  echo "$dd ${MONTHS[$mm]} $yyyy"
}

prettyDate=$(toPrettyDate "$basefile")
dateAuthor="$prettyDate -- $author"
if [[ "$subtitle" != "" ]]; then
  byline="$prettyDate -- $subtitle"
else
  byline="$prettyDate"
fi

echoErr "  trimming..."

echo
# remove front matter
# add chapter title, subtitle -- \n\n## ${author}
# remove HTML blocks
# remove liquid/jekyll blocks
# remove hyperlinks
# remove [^akaroa] links
awk '/---/{p++}p==2' "$file" | \
  sed "s/---/# $title\n\n### ${byline}\n\n#### ${author}/" | \
  sed '/^</,/^<\//d' | \
  sed -r 's/^(\{%.*|.*%\})$//' | \
  sed -r 's/\[([^]]*)\]\([^)]*\)/\1/g' | \
  sed 's/\(.\+\)\[^akaroa\]/\1/g'
echo

echoErr "  finished"
