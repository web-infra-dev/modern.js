import { createParallelWorkflow, createAsyncWorkflow } from '@modern-js/plugin';
import { registerHook } from '@modern-js/core';

export const moduleToolsMenu = createParallelWorkflow<
  undefined,
  { name: string; value: string; runTask: (p: any) => void | Promise<void> }
>();

export const afterDev = createAsyncWorkflow();

export const devHooks = {
  moduleToolsMenu,
  afterDev,
};

export const lifecycle = () => {
  registerHook({ moduleToolsMenu, afterDev } as any);
};

declare module '@modern-js/core' {
  export interface Hooks {
    moduleToolsMenu: typeof moduleToolsMenu;
  }
}
