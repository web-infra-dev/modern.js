const { SourceMapGenerator } = require('source-map');
const path = require('path');
const { createHash } = require('crypto');

const markdownExtensions = [
  'md',
  'markdown',
  'mdown',
  'mkdn',
  'mkd',
  'mdwn',
  'mkdown',
  'ron',
];
const mdx = ['.mdx'];
const md = markdownExtensions.map((/** @type {string} */ d) => '.' + d);

const own = {}.hasOwnProperty;

const marker = {};
const cache = new WeakMap();

/**
 *  This is largely based on existing @mdx-js/loader,
 * replaces internal compilation logic to use @modern-js/mdx-binding instead.
 */
function loader(value, compile, callback) {
  const defaults = this.sourceMap ? { SourceMapGenerator } : {};
  const options = this.getOptions();
  const config = { ...defaults, ...options };
  const hash = getOptionsHash(options);
  const compiler = this._compiler || marker;

  let map = cache.get(compiler);

  if (!map) {
    map = new Map();
    cache.set(compiler, map);
  }

  let process = map.get(hash);

  if (!process) {
    process = createFormatAwareProcessors(compile, config).compile;
    map.set(hash, process);
  }
  process({ value, path: this.resourcePath }).then(
    code => {
      callback(null, code, null);
    },
    error => {
      // const fpath = path.relative(this.context, this.resourcePath);
      error.message = `${fpath}:${error.name}: ${error.message}`;
      callback(null, '', null);
    },
  );
}

function getOptionsHash(options) {
  const hash = createHash('sha256');
  let key;

  for (key in options) {
    if (own.call(options, key)) {
      const value = options[key];

      if (value !== undefined) {
        const valueString = JSON.stringify(value);
        hash.update(key + valueString);
      }
    }
  }

  return hash.digest('hex').slice(0, 16);
}

function createFormatAwareProcessors(compileFunc, compileOptions = {}) {
  function compile({ value, path: p }) {
    const format =
      compileOptions.format === 'md' || compileOptions.format === 'mdx'
        ? compileOptions.format
        : path.extname(p) &&
          (compileOptions.mdExtensions || md).includes(path.extname(p))
        ? 'md'
        : 'mdx';

    const compileMdx = input => compileFunc(input, p);

    const processor =
      format === 'md'
        ? cachedMarkdown || (cachedMarkdown = compileMdx)
        : cachedMdx || (cachedMdx = compileMdx);

    return processor(value);
  }

  const mdExtensions = compileOptions.mdExtensions || md;
  const mdxExtensions = compileOptions.mdxExtensions || mdx;

  let cachedMarkdown;
  let cachedMdx;

  return {
    extnames:
      compileOptions.format === 'md'
        ? mdExtensions
        : compileOptions.format === 'mdx'
        ? mdxExtensions
        : mdExtensions.concat(mdxExtensions),
    compile,
  };
}

module.exports = function (code) {
  const callback = this.async();
  const { compile } = require('@modern-js/mdx-binding');

  return loader.call(this, code, compile, callback);
};
