import { createAsyncWaterfall } from '@modern-js/plugin';

export interface UnbundleDependencies {
  defaultDeps: string[];
  internalPackages: Record<string, string>;
  virtualDeps: Record<string, string>;
  defaultPdnHost: string;
}

export const unbundleDependencies =
  createAsyncWaterfall<UnbundleDependencies>();

export const hooks = {
  unbundleDependencies,
};

declare module '@modern-js/core' {
  export interface Hooks {
    unbundleDependencies: typeof unbundleDependencies;
  }
}
