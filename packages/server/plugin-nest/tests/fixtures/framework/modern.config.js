module.exports = {
  server: {
    // ssr: true,
  },
  runtime: {},
  // output: {
  //   ssg: true
  // },
  plugins: [
    { server: '@modern-js/plugin-bff/server' },
    { server: '@modern-js/plugin-nest/server' },
  ],
};
