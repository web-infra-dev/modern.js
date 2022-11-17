// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import webpack from 'webpack';

export type { BuildExecuter, WebpackBuildError } from '../core/build';
export { webpackBuild } from '../core/build';
export default webpack;
