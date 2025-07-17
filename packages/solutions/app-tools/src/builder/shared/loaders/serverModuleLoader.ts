import type { Rspack } from '@modern-js/uni-builder';

function loader(this: Rspack.LoaderContext) {
  return `module.exports = {}`;
}

export default loader;
