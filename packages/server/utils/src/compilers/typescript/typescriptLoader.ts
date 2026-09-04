import type ts from 'typescript';

export class TypescriptLoader {
  private tsBinary?: typeof ts;

  private appDirectory?: string;

  private compiler?: string;

  constructor({
    appDirectory,
    compiler,
  }: {
    appDirectory: string;
    compiler?: string;
  }) {
    this.appDirectory = appDirectory;
    this.compiler = compiler;
  }

  public load(): typeof ts {
    if (this.tsBinary) {
      return this.tsBinary;
    }

    try {
      const tsPath = require.resolve(this.compiler || 'typescript', {
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
