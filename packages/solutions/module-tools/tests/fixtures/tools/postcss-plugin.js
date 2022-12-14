module.exports = () => {
  // Plugin creator to check options or prepare caches
  return {
    postcssPlugin: 'custom-plugin',
    // Plugin listeners
    Declaration(node, { Rule }) {
      const newRule = new Rule({ selector: 'a', buildConfig: node.source });
      node.root().append(newRule);
      newRule.append(node);
    },
  };
};
module.exports.postcss = true;
