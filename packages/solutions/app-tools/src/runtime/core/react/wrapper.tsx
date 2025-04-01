import React from 'react';
import { type RuntimeContext, RuntimeReactContext } from '../context';

export function wrapRuntimeContextProvider(
  App: React.ReactElement,
  contextValue: RuntimeContext,
) {
  return React.createElement(
    RuntimeReactContext.Provider,
    { value: contextValue },
    App,
  );
}
