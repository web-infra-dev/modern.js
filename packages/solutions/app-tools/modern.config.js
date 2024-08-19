const path = require('path');
const { universalBuildConfig } = require('@scripts/build');

universalBuildConfig[0] = {
  ...universalBuildConfig[0],
  esbuildOptions: options => {
    options.supported = {
      ...options.supported,
      'dynamic-import': true,
    };

    return options;
  },
  copy: {
    patterns: [
      {
        from: '**/*.mjs',
        context: path.join(__dirname, './src'),
        to: '',
      },
    ],
  },
  input: ['src', '!**/*.mjs'],
};

universalBuildConfig[1] = {
  ...universalBuildConfig[0],
  esbuildOptions: options => {
    options.supported = {
      ...options.supported,
      'dynamic-import': true,
    };

    return options;
  },
  copy: {
    patterns: [
      {
        from: '**/*.mjs',
        context: path.join(__dirname, './src'),
        to: '',
      },
    ],
  },
  input: ['src', '!**/*.mjs'],
};

universalBuildConfig[2] = {
  ...universalBuildConfig[0],
  esbuildOptions: options => {
    options.supported = {
      ...options.supported,
      'dynamic-import': true,
    };

    return options;
  },
  copy: {
    patterns: [
      {
        from: '**/*.mjs',
        context: path.join(__dirname, './src'),
        to: '',
      },
    ],
  },
  input: ['src', '!**/*.mjs'],
};

module.exports = {
  buildConfig: universalBuildConfig,
};
