'use strict';

module.exports = {
  root: true,
  // extends: ['eslint:recommended', 'plugin:eslint-plugin/recommended', 'plugin:node/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
    },
  },
  env: {
    node: true,
  },
  rules: {
    'node/no-unpublished-require': 0,
  },
};
