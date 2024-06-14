import React from 'react';
import { RuntimeReactContext, getGlobalApp } from '../context';
import { getGlobalRunner } from '../plugin/runner';

export function createRoot(
  UserApp?: React.ComponentType | null,
  config?: { router: { basename: string } },
) {
  const App = UserApp || getGlobalApp();
  const WrapperComponent: React.ComponentType<any> = props => {
    return React.createElement(
      App || React.Fragment,
      App ? { ...props } : null,
      App
        ? props.children
        : React.Children.map(props.children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, {
                  ...(child.props as object),
                  ...props,
                })
              : child,
          ),
    );
  };

  const runner = getGlobalRunner();

  const HOCApp = runner.hoc(
    { App: WrapperComponent, config: config || {} },
    {
      onLast: ({ App }: any) => {
        const WrapComponent = ({ context, ...props }: any) => {
          return (
            <RuntimeReactContext.Provider value={context}>
              <App {...props} />
            </RuntimeReactContext.Provider>
          );
        };

        return WrapComponent;
      },
    },
  );
  return HOCApp;
}
