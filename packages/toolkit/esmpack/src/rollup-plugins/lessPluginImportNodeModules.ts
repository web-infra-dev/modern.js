import path from 'path';
import resolve from 'resolve';

type Options = {
  prefix?: string;
  paths?: string[];
};

const resolvePlugin = function (less: any) {
  class LessImportNodeModules extends less.FileManager {
    paths: string[];
    prefix: string;
    constructor(options: Options = {}) {
      super(options);
      this.prefix = options.prefix || '~';
      this.paths = options.paths || [];
    }
    supports(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      return this.prefix && filename.charAt(0) === this.prefix;
    }
    supportsSync(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      return this.supports(filename, currentDirectory, options, environment);
    }
    resolve(filename: string) {
      filename = filename.replace(this.prefix, '');
      let resovledFilename = '';
      this.paths.forEach(path => {
        if (resovledFilename) {
          return;
        }
        try {
          const resolved = resolve.sync(filename, {
            basedir: path,
            extensions: ['.less', '.css'],
          });
          if (resolved) {
            resovledFilename = resolved;
          }
        } catch (e) {
          // no-catch
        }
      });
      return (
        resovledFilename || path.join(process.cwd(), 'node_modules', filename)
      );
    }
    loadFile(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      filename = this.resolve(filename);
      return super.loadFile(filename, '', options, environment);
    }
    loadFileSync(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ): any {
      filename = this.resolve(filename);
      return this.loadFileSync(filename, '', options, environment);
    }
  }
  return LessImportNodeModules;
};

class LessPluginImportNodeModules {
  minVersion: [number, number, number];
  constructor(public options: Options = {}) {
    this.options = options;
    this.minVersion = [2, 6, 0];
  }
  install(less: any, pluginManager: any) {
    const LessImportNodeModules = resolvePlugin(less);
    pluginManager.addFileManager(new LessImportNodeModules(this.options));
  }
}

export default LessPluginImportNodeModules;
