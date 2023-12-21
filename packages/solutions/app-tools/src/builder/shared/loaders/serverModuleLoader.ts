import type { webpack, Rspack } from '@modern-js/uni-builder';

function loader(this: webpack.LoaderContext<void> | Rspack.LoaderContext) {
  return `module.exports = {}`;
}

export default loader;
