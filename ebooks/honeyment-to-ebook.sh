#!/bin/bash

set -euo pipefail

DIR=$(readlink -f $0 | xargs dirname)
outputFile=$DIR/honeyment
configFile=$DIR/honeyment.yaml
coverImageFile=$DIR/../images/honeyment-cover.jpg

files=($(grep -l "layout: post" $DIR/../_posts/honeyment/*.md | xargs grep -l "published: true" | sort))

tmpfile=$(mktemp /tmp/honeyment-ebook.md.XXXXXX)
trap 'rm -f -- "$tmpfile"' INT TERM HUP EXIT

touch $tmpfile

cat $DIR/../_posts/honeyment/honeyment-intro.md | sed 's/### In /# In /' >> $tmpfile

# for each file    | trim out the front-matter
echo "${files[@]}" | \
  xargs -n 1 $DIR/trim-md.sh >> $tmpfile

pandoc -S -s --toc-depth=1 -o $outputFile.epub --epub-cover-image=$coverImageFile $configFile $tmpfile
kindlegen $outputFile.epub
