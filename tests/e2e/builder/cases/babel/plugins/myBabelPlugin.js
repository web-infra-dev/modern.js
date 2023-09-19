module.exports = function () {
  return {
    name: 'my-babel-plugin',
    visitor: {
      Identifier(path) {
        const { node } = path;
        if (node?.name === 'a') {
          node.name = 'b';
        }

        if (node?.name === 'aa') {
          node.name = 'bb';
        }
      },
    },
  };
};
