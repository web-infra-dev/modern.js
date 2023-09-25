import fs from 'fs';
import { ICompiler } from '../../../types';
import { rebaseUrls } from './utils';

interface Options {
  compiler: ICompiler;
  stdinDir: string;
}

export default class LessAliasesPlugin {
  compiler: ICompiler;

  stdinDir: string;

  constructor(options: Options) {
    this.compiler = options.compiler;
    this.stdinDir = options.stdinDir;
  }

  install(less: any, pluginManager: any) {
    const getResolve = (filename: string, currentDirectory: string) => {
      return this.compiler.css_resolve(
        filename,
        currentDirectory || this.stdinDir,
      );
    };
    class AliasPlugin extends less.FileManager {
      compiler: ICompiler;

      constructor(options: Options) {
        super();
        this.compiler = options.compiler;
        this.stdinDir = options.stdinDir;
      }

      async loadFile(filename: string, currentDirectory: string) {
        const resolved = getResolve(filename, currentDirectory);
        const rebasedContents = await rebaseUrls(
          resolved,
          this.stdinDir,
          this.compiler.css_resolve,
        );
        const contents = rebasedContents.contents
          ? rebasedContents.contents
          : fs.readFileSync(resolved, 'utf8');

        return {
          filename: resolved,
          contents,
        };
      }
    }
    pluginManager.addFileManager(
      new AliasPlugin({ compiler: this.compiler, stdinDir: this.stdinDir }),
    );
  }
}
