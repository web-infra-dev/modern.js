import * as path from 'path';
import * as fs from 'fs';
import * as egg from 'egg';

class ModernJsLoader extends egg.AppWorkerLoader {
  private readonly pwd: string;

  private readonly realBaseDir: string;

  constructor(options: any) {
    const realBaseDir = options.baseDir;
    const apiDir = options.baseDir;
    options.baseDir = path.join(apiDir, '../');
    super(options);
    this.pwd = options.baseDir;
    options.baseDir = apiDir;
    this.realBaseDir = realBaseDir;
  }

  load() {
    this.mockBaseDir(() => {
      super.load();
    });
  }

  mockBaseDir(callback: (...args: any[]) => void) {
    this.options.baseDir = this.realBaseDir;
    callback();
    this.options.baseDir = this.pwd;
  }

  loadConfig() {
    this.mockBaseDir(() => {
      super.loadConfig();
    });

    const pwd = this.appInfo.baseDir;
    this.config.rundir = path.join(pwd, 'node_modules', '.modernjs_egg/run');
    this.config.logger.dir = path.join(
      pwd,
      'node_modules',
      '.modernjs_egg',
      'logs',
      this.appInfo.name,
    );
    this.config.static.dir = path.join(
      pwd,
      'node_modules',
      '.modernjs_egg',
      'static',
    );
    // https://github.com/eggjs/egg/issues/4109#issuecomment-567557856
    this.config.bodyParser = {
      enableTypes: ['json', 'form', 'text'],
      extendTypes: {
        text: ['text/xml', 'application/xml'],
      },
    };
  }

  loadPlugin() {
    super.loadPlugin.apply(this);
  }

  getPluginPath(plugin: egg.EggPlugin) {
    if (plugin.path) {
      return plugin.path;
    }

    const name = (plugin.package || plugin.name) as string;
    const lookupDirs = [];

    lookupDirs.push(path.join(this.options.baseDir, 'node_modules'));

    for (let i = this.eggPaths.length - 1; i >= 0; i--) {
      const eggPath = this.eggPaths[i];
      lookupDirs.push(path.join(eggPath, 'node_modules'));

      if (eggPath.includes('.pnpm')) {
        lookupDirs.push(path.join(eggPath, '..'));
      }
    }

    lookupDirs.push(path.join(process.cwd(), 'node_modules'));

    for (let dir of lookupDirs) {
      dir = path.join(dir, name);
      if (fs.existsSync(dir)) {
        return fs.realpathSync(dir);
      }
    }

    throw new Error(
      `Can not find plugin ${name} in "${lookupDirs.join(', ')}"`,
    );
  }
}

const EGG_PATH_SYMBOL = Symbol.for('egg#eggPath');
const EGG_LOADER_SYMBOL = Symbol.for('egg#loader');
class Application extends egg.Application {
  get [EGG_PATH_SYMBOL]() {
    return path.dirname(require.resolve('egg'));
  }

  get [EGG_LOADER_SYMBOL]() {
    return ModernJsLoader;
  }
}

class Agent extends egg.Agent {
  get [EGG_PATH_SYMBOL]() {
    return path.dirname(require.resolve('egg'));
  }

  get [EGG_LOADER_SYMBOL]() {
    return ModernJsLoader;
  }
}

module.exports = { ...egg, Application, Agent };
