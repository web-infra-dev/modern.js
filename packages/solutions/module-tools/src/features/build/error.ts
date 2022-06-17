import { SpeedyError } from '@speedy-js/speedy-core';
// import { RollupError } from 'rollup';
export type BuildErrorType = unknown;
// export class BundleDtsError extends Error {
//   constructor(e: unknown) {
//     super('');
//   }
// }

export class ModuleBuildError extends Error {
  public readonly buildError: BuildErrorType;

  constructor(e: unknown) {
    super('');
    this.buildError = e;
  }

  fuck() {
    if (this.buildError instanceof SpeedyError) {
      return this.buildError;
    } else if (this.buildError instanceof Error) {
      return this.buildError;
    }

    return 'nothing';
  }

  // formatSpeedyError() {}
}

export const showModuleBuildError = (e: ModuleBuildError) => {
  console.error(e.fuck());
};
