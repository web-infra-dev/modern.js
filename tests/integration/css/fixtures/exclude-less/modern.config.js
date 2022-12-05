module.exports = {
  tools: {
    less: (opts, { addExcludes }) => {
      addExcludes([/b\.less$/]);
    },
  },
  output: {
    enableAssetFallback: true,
  },
};
