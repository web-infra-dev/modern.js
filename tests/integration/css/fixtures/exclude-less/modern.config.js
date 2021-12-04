/* eslint-disable import/no-commonjs */
module.exports = {
  tools: {
    less: (opts, { addExcludes }) => {
      addExcludes([/b\.less$/]);
    },
  },
};

/* eslint-enable import/no-commonjs */
