import React from 'react';
import { runtime, Plugin } from '../../src/core/plugin';
import { RuntimeReactContext } from '../../src/core/context';

export type WrapOptions = Record<string, unknown>;

export const initialWrapper = (plugins: Plugin[], manager = runtime) => {
  manager.usePlugin(...plugins);

  return <P = Record<string, unknown>>(
    App: React.ComponentType<P>,
    config: WrapOptions,
  ) => wrap(App, config, manager);
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

  const WrapComponent = ({ _internal_context, ...props }: any) =>
    React.createElement(
      RuntimeReactContext.Provider,
      { value: _internal_context },
      React.createElement(WrapperRoot, props),
    );

  return WrapComponent;
};
