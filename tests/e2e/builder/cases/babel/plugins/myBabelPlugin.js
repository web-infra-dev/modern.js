module.exports = function () {
  return {
    name: 'my-babel-plugin',
    visitor: {
      Identifier(path) {
        const { node } = path;
        if (node?.name === 'a') {
          node.name = 'b';
        }
      },
    },
  };
};
