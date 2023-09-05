module.exports = {
  root: true,
  extends: ['@modern-js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  ignorePatterns: [
    'src/templates/common.ts',
    'src/templates/mwa.ts',
    'src/templates/module.ts',
  ],
};
