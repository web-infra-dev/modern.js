const { SourceMapGenerator } = require('source-map');
const path = require('path');

function loader(value, compile, callback, resourcePath) {
  const defaults = this.sourceMap ? { SourceMapGenerator } : {};
  const options = this.getOptions();
  const config = { ...defaults, ...options };

  compile(value, resourcePath, true, config.root, config.defaultLang).then(
    result => {
      callback(null, result.code, null);
      const links = result.links;
      if (config.callback) {
        config.callback({
          resourcePath: this.resourcePath,
          links,
          root: config.root,
          base: config.base,
        });
      }
    },
    error => {
      // const fpath = path.relative(this.context, this.resourcePath);
      error.message = `${fpath}:${error.name}: ${error.message}`;
      callback(null, '', null);
    },
  );
}

module.exports = function (code) {
  const callback = this.async();
  const resourcePath = this.resourcePath;
  const { compile } = require('@modern-js/mdx-rs-binding');

  return loader.call(this, code, compile, callback, resourcePath);
};
