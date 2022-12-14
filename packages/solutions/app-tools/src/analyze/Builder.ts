import type { BuildOptions, BuildResult } from 'esbuild';
import { build } from 'esbuild';

export class Builder {
  private buildRes: BuildResult | undefined;

  async build(options: BuildOptions) {
    this.buildRes = await build(options);
  }

  stop() {
    this.buildRes?.stop && this.buildRes?.stop();
  }
}

export const loaderBuilder = new Builder();
export const serverLoaderBuilder = new Builder();
