/** @type {import('webpack').LoaderDefinition} */
module.exports = function (content) {
  const opts = this.getOptions();
  const ret = content.replace(/(^|\b):root($|\b)/gm, opts.root);
  return ret;
};
