import { createParallelWorkflow } from '@modern-js/plugin';
import { registerHook } from '@modern-js/core';

export const moduleToolsMenu = createParallelWorkflow<
  undefined,
  { name: string; value: string; runTask: (p: any) => void | Promise<void> }
>();

export const devHooks = {
  moduleToolsMenu,
};

export const lifecycle = () => {
  registerHook({ moduleToolsMenu });
};

declare module '@modern-js/core' {
  export interface Hooks {
    moduleToolsMenu: typeof moduleToolsMenu;
  }
}
