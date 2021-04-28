module.exports = {
  env: {
    node: true,
    browser: false,
    jest: true,
    es6: true
  },
  parser: 'babel-eslint',
  parserOptions: {
    allowImportExportEverywhere: true,
    codeFrame: true
  },
  extends: 'eslint:recommended',
  plugins: [],
  rules: {
    indent: ['error', 2],
    'keyword-spacing': ['error', { before: true, after: true }],
    'brace-style': 'error',
    'no-case-declarations': [0],
    'no-tabs': [0],
    'no-mixed-spaces-and-tabs': [0],
    'linebreak-style': [
      'error',
      'unix'
    ],
    quotes: [
      'error',
      'single'
    ],
    semi: [
      'error',
      'always'
    ]
  },
};
