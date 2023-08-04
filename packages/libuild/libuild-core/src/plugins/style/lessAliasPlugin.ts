import fs from 'fs';
import { rebaseUrls } from './utils';

interface Options {
  config: any;
  stdinDir: string;
}

export default class LessAliasesPlugin {
  config: any;

  stdinDir: string;

  constructor(options: Options) {
    this.config = options.config;
    this.stdinDir = options.stdinDir;
  }

  install(less: any, pluginManager: any) {
    const getResolve = (filename: string, currentDirectory: string) => {
      return this.config.css_resolve(filename, currentDirectory || this.stdinDir);
    };
    class AliasPlugin extends less.FileManager {
      config: any;

      constructor(options: Options) {
        super();
        this.config = options.config;
        this.stdinDir = options.stdinDir;
      }

      async loadFile(filename: string, currentDirectory: string) {
        const resolved = getResolve(filename, currentDirectory);
        const rebasedContents = await rebaseUrls(resolved, this.stdinDir, this.config.css_resolve);
        const contents = rebasedContents.contents ? rebasedContents.contents : fs.readFileSync(resolved, 'utf8');

        return {
          filename: resolved,
          contents,
        };
      }
    }
    pluginManager.addFileManager(new AliasPlugin({ config: this.config, stdinDir: this.stdinDir }));
  }
}
