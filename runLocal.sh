#! /bin/bash

set -ef

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

function usage() {
  echo "Usage: $0 [-i] [-c] [-b]"
  echo
  echo "  -i   enable incremental compilation"
  echo "  -c   clean any previously built output first"
  echo "  -b   bundle install first, to check required Ruby gems are installed"
  exit 1
}

function bundle_install() {
  echo "Ensuring that the required Ruby gems are installed..."
  (cd $DIR && bundle install --quiet)
  echo "Done with exit code $?"
}


while getopts "ci" o; do
  case "${o}" in
    c)
      echo "Cleaning output..."
      jekyll clean
      ;;
    i)
      echo "Using incremental compilation..."
      INCREMENTAL="--incremental"
      ;;
    b)
      bundle_install
      ;;
    *)
      usage
      ;;
  esac
done

echo


# you need to apt-get or brew install imagemagick, then gem install bundle, then bundle install

# rvm install <version in Gemfile>
# gem install bundle
# bundle install
# ./runLocal

${DIR}/buildImages.sh

jekyll serve \
  --config $DIR/_config.yml \
  --source $DIR \
  --destination $DIR/_site \
  --layouts $DIR/_layouts \
  --drafts --future \
  --trace \
  --watch --trace --profile $INCREMENTAL
