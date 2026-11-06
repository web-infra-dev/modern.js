import type React from 'react';
import {
  InternalRuntimeContext,
  RuntimeContext,
  type TInternalRuntimeContext,
  type TRuntimeContext,
} from '../context';

const privateFields = new Set([
  'routeManifest',
  'routerContext',
  'unstable_getBlockNavState',
  'ssrContext',
  '_internalContext',
  '_internalRouterBaseName',
  'application',
]);
const publicViews = new WeakMap<object, TRuntimeContext>();
/** A stable public view of the canonical context, not a synchronized copy. */
export function wrapRuntimeContextProvider(
  App: React.ReactElement,
  context: TRuntimeContext,
) {
  let view = publicViews.get(context);
  if (!view) {
    view = new Proxy(context, {
      get: (target, key) =>
        privateFields.has(String(key)) ? undefined : Reflect.get(target, key),
      has: (target, key) =>
        !privateFields.has(String(key)) && Reflect.has(target, key),
      ownKeys: target =>
        Reflect.ownKeys(target).filter(key => !privateFields.has(String(key))),
      getOwnPropertyDescriptor: (target, key) =>
        privateFields.has(String(key))
          ? undefined
          : Reflect.getOwnPropertyDescriptor(target, key),
    });
    publicViews.set(context, view);
  }
  return (
    <InternalRuntimeContext.Provider value={context as TInternalRuntimeContext}>
      <RuntimeContext.Provider value={view}>{App}</RuntimeContext.Provider>
    </InternalRuntimeContext.Provider>
  );
}
