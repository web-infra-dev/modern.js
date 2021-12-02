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

export class PluginNewContext {
  private readonly solution: Solution | 'custom';

  constructor(solution: Solution | 'custom') {
    this.solution = solution;
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
          ...params,
        }),
      });
      return;
    }
    throw new Error(`this solution project not support create subproject`);
  }
}
