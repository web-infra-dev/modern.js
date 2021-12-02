import {
  ActionElement,
  ActionFunction,
  ActionType,
  ModuleActionFunctions,
  MWAActionElements,
  MWAActionFunctions,
  Solution,
  SubSolution,
} from '@modern-js/generator-common';
import {
  MWANewAction,
  ModuleNewAction,
  MonorepoNewAction,
} from '@modern-js/new-action';

export class PluginNewAPI {
  private readonly solution: Solution | 'custom';

  private readonly projectPath: string;

  constructor(solution: Solution | 'custom', projectPath: string) {
    this.solution = solution;
    this.projectPath = projectPath;
  }

  get method() {
    return {
      createElement: this.createElement.bind(this),
      enableFunc: this.enableFunc.bind(this),
      createSubProject: this.createSubProject.bind(this),
    };
  }

  async createElement(element: ActionElement, params: Record<string, unknown>) {
    if (this.solution === Solution.MWA) {
      if (!MWAActionElements.includes(element)) {
        throw new Error(`the element ${element} not support to create`);
      }
      await MWANewAction({
        config: JSON.stringify({
          action: ActionType.Element,
          element,
          pwd: this.projectPath,
          ...params,
        }),
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
          action: ActionType.Function,
          function: func,
          pwd: this.projectPath,
          ...params,
        }),
      });
      return;
    }
    if (this.solution === Solution.Module) {
      if (!ModuleActionFunctions.includes(func)) {
        throw new Error(`the func ${func} not support to enable`);
      }
      await ModuleNewAction({
        config: JSON.stringify({
          action: ActionType.Function,
          function: func,
          pwd: this.projectPath,
          ...params,
        }),
      });
      return;
    }
    throw new Error(`this solution project not support enable function`);
  }

  async createSubProject(
    solution: SubSolution,
    params: Record<string, unknown>,
  ) {
    if (this.solution === Solution.Monorepo) {
      await MonorepoNewAction({
        config: JSON.stringify({
          solution,
          pwd: this.projectPath,
          ...params,
        }),
      });
      return;
    }
    throw new Error(`this solution project not support create subproject`);
  }
}
