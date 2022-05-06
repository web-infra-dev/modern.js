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

    /* eslint-disable @typescript-eslint/no-unused-vars */
    supports(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      return this.prefix && filename.charAt(0) === this.prefix;
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */

    supportsSync(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      return this.supports(filename, currentDirectory, options, environment);
    }

    resolve(filename: string) {
      // eslint-disable-next-line no-param-reassign
      filename = filename.replace(this.prefix, '');
      let resolvedFilename = '';
      this.paths.forEach(path => {
        if (resolvedFilename) {
          return;
        }
        try {
          const resolved = resolve.sync(filename, {
            basedir: path,
            extensions: ['.less', '.css'],
          });
          if (resolved) {
            resolvedFilename = resolved;
          }
        } catch (e) {
          // no-catch
        }
      });
      return (
        resolvedFilename || path.join(process.cwd(), 'node_modules', filename)
      );
    }

    loadFile(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ) {
      return super.loadFile(this.resolve(filename), '', options, environment);
    }

    loadFileSync(
      filename: string,
      currentDirectory: string,
      options: unknown,
      environment: any,
    ): any {
      return this.loadFileSync(
        this.resolve(filename),
        '',
        options,
        environment,
      );
    }
  }
  return LessImportNodeModules;
};

class LessPluginImportNodeModules {
  minVersion: [number, number, number];

  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
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
