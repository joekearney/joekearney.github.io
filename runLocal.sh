#! /bin/bash

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

echo "Ensuring that the required Ruby gems are installed..."
$(cd $DIR; bundle install --quiet)
echo "Done with exit code $?"

jekyll serve -s $DIR -w