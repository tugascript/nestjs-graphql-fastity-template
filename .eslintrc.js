module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'header'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'header/header': [
      2,
      'block',
      [
        '',
        ' This file is part of Nest GraphQL Fastify Template',
        '',
        ' This Source Code Form is subject to the terms of the Mozilla Public',
        ' License, v2.0. If a copy of the MPL was not distributed with this',
        ' file, You can obtain one at https://mozilla.org/MPL/2.0/.',
        '',
        ` Copyright © ${new Date().getFullYear()}`,
        ' Afonso Barracha',
        '',
      ],
      2,
    ],
  },
};
