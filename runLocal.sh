#! /bin/bash

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

echo "Ensuring that the required Ruby gems are installed..."
$(cd $DIR; bundle install --quiet)
echo "Done with exit code $?"

# you need to apt-get or brew install imagemagick, then gem install bundle, then bundle installß

jekyll serve -s $DIR -w