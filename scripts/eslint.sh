#!/bin/bash

npm run build || exit 1
ln -s ../../eslint-plugin-no-unused node_modules/eslint-plugin-no-unused
cd tests
npm run lint
