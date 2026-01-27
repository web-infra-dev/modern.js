import React from 'react';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { type RuntimeContext, RuntimeReactContext } from '../context';

export function wrapRuntimeContextProvider(
  App: React.ReactElement,
  contextValue: RuntimeContext,
  helmetContext?: { helmet?: HelmetServerState },
): React.ReactElement {
  return React.createElement(
    HelmetProvider,
    { context: helmetContext || {} },
    React.createElement(
      RuntimeReactContext.Provider,
      { value: contextValue },
      App,
    ),
  );
}
