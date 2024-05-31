import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { RuntimeReactContext } from '../context/runtime';
import { getGlobalApp } from '../context';
import { getGlobalRunner } from '../plugin/runner';

export function createRoot(UserApp?: React.ComponentType) {
  const App = UserApp || getGlobalApp();
  const WrapperComponent: React.ComponentType<any> = props => {
    const element = React.createElement(
      App || React.Fragment,
      App ? { ...props } : null,
      App
        ? props.children
        : React.cloneElement(props.children, {
            ...props.children?.props,
            ...props,
          }),
    );

    return element;
  };

  const runner = getGlobalRunner();
  const HOCApp = runner.hoc(
    { App: WrapperComponent },
    {
      onLast: ({ App }: any) => {
        const WrapComponent = ({ context, ...props }: any) => {
          return (
            <RuntimeReactContext.Provider value={context}>
              <App {...props} />
            </RuntimeReactContext.Provider>
          );
        };

        return hoistNonReactStatics(WrapComponent, App);
      },
    },
  );
  return HOCApp;
}
