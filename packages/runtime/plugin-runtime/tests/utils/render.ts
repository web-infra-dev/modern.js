import React from 'react';
import { runtime, Plugin } from '../../src/runtime/plugin';

export type RenderProps = {
  App: React.ComponentType;
};

export const initialRender = (plugins: Plugin[], manager = runtime) => {
  manager.usePlugin(...plugins);

  return {
    clientRender: (
      props: RenderProps,
      ModernRender: (App: React.ReactNode) => void,
      ModernHydrate: (App: React.ReactNode, callback?: () => void) => void,
    ) => clientRender(props, ModernRender, ModernHydrate, manager),
    serverRender: (props: RenderProps) => serverRender(props, manager),
  };
};

export const clientRender = (
  { App }: RenderProps,
  ModernRender: (App: React.ReactNode) => void,
  ModernHydrate: (App: React.ReactNode, callback?: () => void) => void,
  manager = runtime,
) => {
  const runner = manager.init();

  return runner.client(
    { App, ModernRender, ModernHydrate },
    {
      onLast: async ({ App, ModernRender }) => {
        ModernRender(React.createElement(App));
      },
    },
  );
};

export const serverRender = ({ App }: RenderProps, manager = runtime) => {
  const runner = manager.init();

  return runner.server({ App });
};
