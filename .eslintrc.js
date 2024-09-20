module.exports = {
  env: {
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:perfectionist/recommended-natural',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: [
    'import',
    '@typescript-eslint',
    'prettier',
    'no-relative-import-paths',
    'perfectionist',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    '@typescript-eslint/ban-types': [
      'error',
      {
        extendDefaults: true,
        types: {
          '{}': false,
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    'linebreak-style': 'off',
    'no-console': 'error',
    'no-relative-import-paths/no-relative-import-paths': [
      'warn',
      {
        prefix: '#afpp/',
      },
    ],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'object-shorthand': 'error',
    'perfectionist/sort-imports': [
      'error',
      {
        type: 'natural',
        order: 'asc',
        'internal-pattern': ['#*/**'],
        groups: [
          'builtin', // Built-in imports (come from NodeJS native) go first
          'external', // <- External imports
          'internal', // <- Absolute imports
          ['sibling', 'parent'], // <- Relative imports, the sibling and parent types they can be mingled together
          'index', // <- index imports
          'unknown', // <- unknown
        ],
        'custom-groups': {},
        'newlines-between': 'always',
      },
    ],
  },
};
