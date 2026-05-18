module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    'react-native/no-raw-text': ['error', { skip: ['Text'] }],
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',  // too strict — colors in StyleSheet.create are fine
    'react-native/sort-styles': 'off',         // enforcing alphabetical style props adds no value
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
    'import/namespace': 'off',     // crashes with TypeScript resolver — use tsc for namespace checks
    'import/no-unresolved': 'off', // tsc handles this; eslint-plugin-import can't resolve @ path aliases
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'babel.config.js',
  ],
};
