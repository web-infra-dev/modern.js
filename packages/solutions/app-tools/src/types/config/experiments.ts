import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderExperimentsConfig = Required<BuilderConfig>['experiments'];

export type ExperimentsUserConfig = BuilderExperimentsConfig;
