import { BuilderConfig } from '../types';

export function webpackConfigProvider({ config }: { config: BuilderConfig }) {
  console.log(config);
}
