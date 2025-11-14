import React from 'react';
import {
  InternalRuntimeContext,
  RuntimeContext,
  type TRuntimeContext,
} from '../context';

export function wrapRuntimeContextProvider(
  App: React.ReactElement,
  contextValue: TRuntimeContext,
) {
  return React.createElement(
    InternalRuntimeContext.Provider,
    { value: contextValue },
    React.createElement(RuntimeContext.Provider, { value: contextValue }, App),
  );
}
