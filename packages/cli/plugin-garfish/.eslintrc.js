module.exports = {
  extends: ['@modern-js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  ignorePatterns: ['type.d.ts', 'tests/**/*.tsx'],
};
