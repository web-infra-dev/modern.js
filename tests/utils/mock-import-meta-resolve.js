const moduleResolve = (name, pathURL) => {
  const p = pathURL.pathname;

  const res = require.resolve(name, {
    paths: [p],
  });

  return new URL(`file://${res}`);
};

module.exports = {
  moduleResolve,
};
