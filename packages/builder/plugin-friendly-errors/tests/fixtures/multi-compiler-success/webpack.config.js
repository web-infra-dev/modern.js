module.exports = [
    {
      mode: 'development',
      entry: __dirname + "/index.js",
      output: {
        path: __dirname + "/dist",
        filename: "bundle.js"
      }
    },
    {
      mode: 'development',
      entry: __dirname + "/index2.js",
      output: {
        path: __dirname + "/dist",
        filename: "bundle2.js"
      }
    }
];
