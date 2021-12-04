/* eslint-disable import/no-commonjs */
module.exports = {
  tools: {
    sass: (opts, { addExcludes }) => {
      addExcludes([/b\.scss$/]);
    },
  },
};

/* eslint-enable import/no-commonjs */
