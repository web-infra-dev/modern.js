module.exports = {
  extensions: {
    pluginImport: [
      {
        fromSource: "foo",
        replaceJs: {
          replaceExpr: (member) => `foo/__/${member}`
        },
        replaceCss: {
          replaceExpr: (member) => `foo/style/${member}`
        }
      }
    ],
  },
};
