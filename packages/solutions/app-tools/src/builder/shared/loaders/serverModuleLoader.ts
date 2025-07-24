import type { Rspack } from '@modern-js/builder';

function loader(this: Rspack.LoaderContext) {
  return `module.exports = {}`;
}

export default loader;
