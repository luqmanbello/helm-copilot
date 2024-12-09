module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      project: './tsconfig.json'
  },
  plugins: [
      '@typescript-eslint'
  ],
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
  ],
  rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      // Add more custom rules as needed
  },
  ignorePatterns: [
      'out',
      'dist',
      '**/*.d.ts',
      'webpack.config.js',
      'jest.config.js'
  ],
  env: {
      node: true,
      jest: true
  }
};