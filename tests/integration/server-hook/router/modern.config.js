module.exports = {
  runtime: {
    router: false,
    state: false,
  },
  server: {
    routes: {
      home: '/rewrite',
      entry: '/redirect',
    },
  },
};
