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
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: false },
        ],
      },
    },
  ],
};
