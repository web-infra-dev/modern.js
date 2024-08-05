import React from 'react';
import { runtime, Plugin } from '../../src/core/plugin';
import { getInitialContext } from '../../src/core/context/runtime';
import { wrapRuntimeContextProvider } from '../../src/core/react/wrapper';

export type WrapOptions = Record<string, unknown>;

export const initialWrapper = (plugins: Plugin[], manager = runtime) => {
  manager.usePlugin(...plugins);

  return <P = Record<string, unknown>>(
    App: React.ComponentType<P>,
    config: WrapOptions,
  ) => wrap(App, config, manager);
};

export const wrapRuntimeProvider = (
  App: React.ComponentType<any>,
  manager = runtime,
) => {
  return (props: any) =>
    wrapRuntimeContextProvider(
      React.createElement(App, props),
      getInitialContext(manager.init()),
    );
};

export const wrap = <P = Record<string, unknown>>(
  App: React.ComponentType<any>,
  // eslint-disable-next-line no-empty-pattern
  {}: WrapOptions,
  manager = runtime,
) => {
  const runner = manager.init();

  const WrapperComponent: React.ComponentType<P> = props => {
    const element = React.createElement(
      App,
      { ...props },
      (props as any).children,
    );
    return element;
  };

  const WrapperRoot = runner.wrapRoot(WrapperComponent);

  return (props: any) =>
    React.createElement(wrapRuntimeProvider(WrapperRoot, runtime), props);
};
