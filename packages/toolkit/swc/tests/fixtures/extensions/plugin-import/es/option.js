module.exports = {
  extensions: {
    pluginImport: [
      {
        fromSource: "foo",
        replaceJs: {
          replaceExpr: (member) => `foo/__/${member}`,
          lower: true
        },
        replaceCss: {
        }
      }
    ],
  },
};
