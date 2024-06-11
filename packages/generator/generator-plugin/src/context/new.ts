import {
  ActionElement,
  ActionFunction,
  ActionType,
  ModuleActionFunctions,
  MWAActionElements,
  MWAActionFunctions,
  Solution,
} from '@modern-js/generator-common';
import { MWANewAction, ModuleNewAction } from '@modern-js/new-action';

export class PluginNewAPI {
  private readonly solution: Solution | 'custom';

  private readonly projectPath: string;

  private readonly inputData: Record<string, any>;

  constructor(
    solution: Solution | 'custom',
    projectPath: string,
    inputData: Record<string, any>,
  ) {
    this.solution = solution;
    this.projectPath = projectPath;
    this.inputData = inputData;
    // when use new command, listeners will create more than 10
    process.setMaxListeners(20);
  }

  get method() {
    return {
      createElement: this.createElement.bind(this),
      enableFunc: this.enableFunc.bind(this),
    };
  }

  async createElement(element: ActionElement, params: Record<string, unknown>) {
    if (this.solution === Solution.MWA) {
      if (!MWAActionElements.includes(element)) {
        throw new Error(`the element ${element} not support to create`);
      }
      await MWANewAction({
        config: JSON.stringify({
          actionType: ActionType.Element,
          element,
          noNeedInstall: true,
          ...this.inputData,
          ...params,
        }),
        cwd: this.projectPath,
      });
      return;
    }
    throw new Error(`this solution project not support create element`);
  }

  async enableFunc(func: ActionFunction, params?: Record<string, unknown>) {
    if (this.solution === Solution.MWA) {
      if (!MWAActionFunctions.includes(func)) {
        throw new Error(`the func ${func} not support to enable`);
      }
      await MWANewAction({
        config: JSON.stringify({
          actionType: ActionType.Function,
          function: func,
          noNeedInstall: true,
          ...this.inputData,
          ...params,
        }),
        cwd: this.projectPath,
      });
      return;
    }
    if (this.solution === Solution.Module) {
      if (!ModuleActionFunctions.includes(func)) {
        throw new Error(`the func ${func} not support to enable`);
      }
      await ModuleNewAction({
        config: JSON.stringify({
          actionType: ActionType.Function,
          function: func,
          noNeedInstall: true,
          ...this.inputData,
          ...params,
        }),
        cwd: this.projectPath,
      });
      return;
    }
    throw new Error(`this solution project not support enable function`);
  }
}
