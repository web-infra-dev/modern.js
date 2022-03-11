import { createAsyncWaterfall } from '@modern-js/plugin';

export interface UnbundleDependencies {
  defaultDeps: string[];
  internalPackages: Record<string, string>;
  virtualDeps: Record<string, string>;
  defaultPdnHost: string;
}

export const unbundleDependencies =
  createAsyncWaterfall<UnbundleDependencies>();

declare module '@modern-js/core' {
  export interface Hooks {
    unbundleDependencies: typeof unbundleDependencies;
  }
}
