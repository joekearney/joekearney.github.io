#! /bin/bash

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

echo "Ensuring that the required Ruby gems are installed..."
$(cd $DIR; bundle install --quiet)
echo "Done with exit code $?"

# you need to apt-get or brew install imagemagick, then gem install bundle, then bundle install

# rvm install 2.0.0
# gem install bundle
# gem install jekyll
# bundle install
# ./runLocal

jekyll serve -s $DIR -w
