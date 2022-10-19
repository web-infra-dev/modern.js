module.exports = [
    {
      entry: __dirname + "/index.js",
      output: {
        path: __dirname + "/dist",
        filename: "bundle.js"
      }
    },
    {
      entry: __dirname + "/index2.js",
      output: {
        path: __dirname + "/dist",
        filename: "bundle2.js"
      }
    }
];
