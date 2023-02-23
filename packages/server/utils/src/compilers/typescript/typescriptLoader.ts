import type ts from 'typescript';

export class TypescriptLoader {
  private tsBinary?: typeof ts;

  private appDirectory?: string;

  constructor({ appDirectory }: { appDirectory: string }) {
    this.appDirectory = appDirectory;
  }

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    try {
      const tsPath = require.resolve('typescript', {
        paths: [this.appDirectory || process.cwd()],
      });

      const ts = require(tsPath);
      return ts;
    } catch (error) {
      throw new Error(
        'TypeScript could not be found! Please, install "typescript" package.',
      );
    }
  }
}
