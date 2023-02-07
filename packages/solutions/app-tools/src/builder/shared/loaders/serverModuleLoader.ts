import type { webpack } from '@modern-js/builder-webpack-provider';
import type { Rspack } from '@modern-js/builder-rspack-provider';

function loader(this: webpack.LoaderContext<void> | Rspack.LoaderContext) {
  return `module.exports = {}`;
}

export default loader;
