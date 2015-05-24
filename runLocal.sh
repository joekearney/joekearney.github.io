#! /bin/bash

SCRIPT=$(readlink -f $0)
DIR=$(dirname $SCRIPT)

jekyll serve -s $DIR -w