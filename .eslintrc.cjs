module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ['airbnb-base', 'plugin:jsdoc/recommended', 'prettier'],
  plugins: ['html', 'jsdoc', 'sql', 'prettier'],
  settings: {
    'html/html-extensions': ['.html', '.ejs']
  },
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error',
    'sql/format': [
      2,
      {
        ignoreExpressions: false,
        ignoreInline: true,
        ignoreTagless: true
      }
    ],
    'sql/no-unsafe-query': [
      2,
      {
        allowLiteral: false
      }
    ],
    'import/extensions': [{ js: 'always', mjs: 'always', json: 'always' }]
  }
};
