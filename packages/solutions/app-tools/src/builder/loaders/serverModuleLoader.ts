import { LoaderContext } from 'webpack';

function loader(this: LoaderContext<void>) {
  return `module.exports = {}`;
}

export default loader;
