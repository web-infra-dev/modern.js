import type { SharedExperimentsConfig } from '@modern-js/builder-shared';

export type ExperimentsConfig = SharedExperimentsConfig & {
  sourceBuild?: boolean;
};

export type NormalizedExperimentsConfig = Required<ExperimentsConfig>;
