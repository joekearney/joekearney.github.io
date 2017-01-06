#! /bin/bash

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

echo "Ensuring that the required Ruby gems are installed..."
$(cd $DIR && bundle install --quiet)
echo "Done with exit code $?"

# you need to apt-get or brew install imagemagick, then gem install bundle, then bundle install

# rvm install <version in Gemfile>
# gem install bundle
# bundle install
# ./runLocal

# TODO do arg processing properly
if [[ "$1" == "-c" || "$2" == "-c" ]]; then
  echo
  echo "Cleaning output"
  jekyll clean
fi
if [[ "$1" == "-i" || "$2" == "-i" ]]; then
  echo
  echo "Using incremental compilation..."
  INCREMENTAL="--incremental"
fi

jekyll serve \
  --config $DIR/_config.yml \
  --source $DIR \
  --destination $DIR/_site \
  --layouts $DIR/_layouts \
  --drafts --future \
--watch --trace --profile $INCREMENTAL
