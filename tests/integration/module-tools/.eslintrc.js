module.exports = {
  root: true,
  extends: ['@modern-js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      './fixtures/build/tsconfig.json',
      './fixtures/build-legacy/tsconfig.json',
      './fixtures/build-preset/tsconfig.json',
      './fixtures/build-config/tsconfig.json',
      './fixtures/build-config-bundleless/tsconfig.json',
      './bundle/tsconfig.json',
    ],
  },
};
