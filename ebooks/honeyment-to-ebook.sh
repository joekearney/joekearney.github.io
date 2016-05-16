#!/bin/bash

DIR=$(readlink -f $0 | xargs dirname)
outputFile=$DIR/honeyment
configFile=$DIR/honeyment.yaml
coverImageFile=$DIR/../images/honeyment-cover.jpg

files=($(ls $DIR/../_posts/honeyment/*.md | sort))

tmpfile=$(mktemp /tmp/honeyment-ebook.md.XXXXXX)
trap 'rm -f -- "$tmpfile"' INT TERM HUP EXIT

# for each file    | trim out the front-matter
echo "${files[@]}" | xargs -n 1 $DIR/trim-md.sh > $tmpfile && pandoc -s -o $outputFile.epub $configFile --epub-cover-image=$coverImageFile $tmpfile && kindlegen $outputFile.epub
