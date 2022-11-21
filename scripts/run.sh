#!/bin/bash

npm run build || exit 1
cd tests
NODE_DEBUG=no-unused node ../lib/cli/index "$@"
