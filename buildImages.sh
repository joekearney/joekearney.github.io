#! /bin/bash

function buildImage() {
  local dotFile=$1
  local filenameStem=$(basename ${dotFile%.dot})    # filename of .dot file
  local srcdirname=$(dirname $dotFile)              # directory of .dot file
  local imgdirname="${srcdirname%src}img"           # directory to place .png file

  local input=${srcdirname}/${filenameStem}.dot
  local output=${imgdirname}/${filenameStem}.png
  echo "  Building ${filenameStem} => [${output}]..."
  dot -Tpng ${input} > ${output}
}

if ! command -v dot; then
  echo "The dot executable must be available to build images"
  exit 1
fi

echo "Building Graphviz diagrams..."

for d in images/dot/src/*.dot; do
  buildImage ${d}
done

echo "Finished building Graphviz diagrams"
