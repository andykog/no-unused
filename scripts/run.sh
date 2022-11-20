#!/bin/bash

if [ -z "$@" ]
then
  echo "Error: missing arguments, try ./scripts/run.sh specs/arrowFunction.ts"
  exit 1;
fi

npm run build || exit 1
cd tests
NODE_DEBUG=no-unused node ../lib/cli/index "$@"
