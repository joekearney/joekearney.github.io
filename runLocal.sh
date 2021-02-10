#! /bin/bash

set -ef

SCRIPT=$(cd "$(dirname $0)" && pwd)/$(basename $0)
DIR=$(dirname $SCRIPT)

# disable deprecation warnings, since there's nothing we can do about them
export RUBYOPT='-W:no-deprecated'

function usage() {
  echo "Usage: $0 [-i] [-c] [-b]"
  echo
  echo "  -i   enable incremental compilation"
  echo "  -c   clean any previously built output first"
  echo "  -b   bundle install first, to check required Ruby gems are installed"
  exit 1
}

function bundle_install() {
  echo "Ensuring that the required dependencies are installed..."
  # if ! brew list libxml2 > /dev/null; then
  #   echo "libxml2 required: brew install libxml2"
  #   exit 1
  # fi
  # if ! brew list imagemagick@6 > /dev/null; then
  #   echo "imagemagick v6 required with special linking:"
  #   echo "brew install imagemagick@6 && brew link imagemagick@6 --force"
  #   exit 1
  # fi
  # if ! brew list dot > /dev/null; then
  #   echo "dot required: brew install dot"
  #   exit 1
  # fi
  # bundle config build.nokogiri --use-system-libraries \
  #   --with-xml2-include=$(brew --prefix libxml2)/include/libxml2
  bundle install #--quiet
  echo "Done with exit code $?"
}

LOCATION_PARAMS="--config $DIR/_config.yml \
--source $DIR \
--destination $DIR/_site \
--layouts $DIR/_layouts"

function clean_output() {
  jekyll clean ${LOCATION_PARAMS}

}


while getopts "bci" o; do
  case "${o}" in
    c)
      echo "Cleaning output..."
      clean_output
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

${DIR}/buildImages.sh || echo "Skipping building dot images"

jekyll serve ${LOCATION_PARAMS} \
  --drafts --future \
  --trace --watch --profile $INCREMENTAL
