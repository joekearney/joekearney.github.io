#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $0 <filename>"
  echo "Trims out the yaml front matter, adds '# <Title>', then prints the content"
  exit 1
fi

file=$1
title=$(egrep 'title: .*' $file | sed -r 's/^title: "?([^"]*)"?$/\1/')

echo
awk '/---/{p++}p==2' $file | sed "s/---/# $title/" | sed '/^</,/^<\//d'
echo
