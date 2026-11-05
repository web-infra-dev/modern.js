import type React from 'react';
import { createContext } from 'react';
import { addBasename, removeBasename } from '../../mf/location';
import {
  createApplicationInstance,
  type ApplicationEnvironment,
} from '../application/instance';
import {
  type ApplicationDefinition,
  getApplicationDefinition,
  registerApplicationRoot,
} from '../application/definition';
import { ScopedRootPropsContext } from '../context/runtime';

export interface ScopedRootDefinition extends ApplicationDefinition {
  routes: NonNullable<ApplicationDefinition['routes']>;
  dataRoute?: string;
  getDataBase: () => string;
}
export const registerScopedRoot = registerApplicationRoot;
export const getScopedRootDefinition = getApplicationDefinition as (
  Root: React.ComponentType<any>,
) => ScopedRootDefinition | undefined;

/** Translate only data requests to the producer's standalone route endpoint. */
export function getScopeDataUrl(
  definition: ScopedRootDefinition,
  routeBasename: string,
  input: URL,
): URL {
  const url = new URL(input);
  const producer = new URL(definition.getDataBase());
  url.protocol = producer.protocol;
  url.hostname = producer.hostname;
  url.port = producer.port;
  url.pathname = addBasename(
    addBasename(
      removeBasename(url.pathname, routeBasename) ?? url.pathname,
      definition.dataRoute || '/',
    ),
    definition.basename || '/',
  );
  return url;
}

export function createScopeRuntime(
  definition: ScopedRootDefinition,
  options: Omit<ApplicationEnvironment, 'output'>,
) {
  return createApplicationInstance(definition, {
    ...options,
    output: 'fragment',
    getDataUrl: url =>
      getScopeDataUrl(definition, options.basename || '/', url),
  });
}
export type PreparedScope = ReturnType<typeof createScopeRuntime> & {
  setNavigation?: (
    navigation:
      | import('@module-federation/bridge-react/base').BridgeNavigation
      | undefined,
  ) => void;
};
export const PreparedScopeContext = createContext<PreparedScope | undefined>(
  undefined,
);
export function PreparedScopedRoot({
  instance,
  props,
}: {
  instance: PreparedScope;
  props: Record<string, unknown>;
}) {
  const { Root } = instance;
  return (
    <ScopedRootPropsContext.Provider value={props}>
      <Root {...props} />
    </ScopedRootPropsContext.Provider>
  );
}
