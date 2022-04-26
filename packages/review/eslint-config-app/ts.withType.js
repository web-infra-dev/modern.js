module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.d.ts', '*.tsx'],
      // modern.config.ts is usually not included in tsconfig.json
      excludedFiles: ['modern.config.ts'],
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // don't set tsconfigRootDir, using the path relative to the cwd
        project: ['./tsconfig.json'],
      },
      extends: [
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: false },
        ],
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  ],
};
