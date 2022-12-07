module.exports = {
  tools: {
    sass: (opts, { addExcludes }) => {
      addExcludes([/b\.scss$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
};
