#!/bin/bash

npm run build || exit 1
cd tests
npx eslint types/**/*.ts syntax/**/*.ts syntax/**/*.tsx
