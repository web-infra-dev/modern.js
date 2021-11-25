import * as path from 'path';
import * as egg from 'egg';
import { ModernJsAppLoader } from './ModernJsAppLoader';
import { ModernJsAgentLoader } from './ModernJsAgentLoader';

const EGG_PATH_SYMBOL = Symbol.for('egg#eggPath');
const EGG_LOADER_SYMBOL = Symbol.for('egg#loader');
class Application extends egg.Application {
  get [EGG_PATH_SYMBOL]() {
    return path.dirname(require.resolve('egg'));
  }

  get [EGG_LOADER_SYMBOL]() {
    return ModernJsAppLoader;
  }
}

class Agent extends egg.Agent {
  get [EGG_PATH_SYMBOL]() {
    return path.dirname(require.resolve('egg'));
  }

  get [EGG_LOADER_SYMBOL]() {
    return ModernJsAgentLoader;
  }
}

module.exports = { ...egg, Application, Agent };
