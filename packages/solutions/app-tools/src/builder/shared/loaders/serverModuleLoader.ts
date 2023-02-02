import type { webpack } from '@modern-js/builder-webpack-provider';
import type { rspack } from '@modern-js/builder-rspack-provider';

function loader(this: webpack.LoaderContext<void> | rspack.LoaderContext) {
  return `module.exports = {}`;
}

export default loader;
