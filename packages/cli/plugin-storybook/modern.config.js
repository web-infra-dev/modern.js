const { legacyPresets } = require('@scripts/build');

module.exports = {
  buildConfig: [
    ...legacyPresets.UNIVERSAL_JS,
    {
      input: [],
      dts: false,
      copy: {
        patterns: [
          {
            from: './template',
            to: './dist/js/template',
          },
        ],
      },
    },
  ],
};
