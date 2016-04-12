#!/bin/bash

if [ "$1" == "local" ]; then
  TARGET="http://localhost:4000"
elif [[ "$1" == "prod" ]]; then
  TARGET="http://www.joekearney.co.uk"
else
  echo "Usage: $0 <local|prod>"
  exit 1
fi

linkchecker $TARGET --check-extern
