'use strict'

import neostandard from 'neostandard'

export default neostandard({
  ts: true,
  ignores: ['node_modules', 'dist'],
  extends: ['plugin:prettier/recommended', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        printWidth: 120,
      },
    ],
    '@stylistic/space-before-function-paren': 'off',
  },
})
