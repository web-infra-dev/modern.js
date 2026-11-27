import React, { useContext } from 'react';
import { InternalRuntimeContext } from '../context';
import { getDefaultApplicationDefinition } from '../application/default';
import { registerApplicationRoot } from '../application/definition';

export interface CreateRootOptions {
  route?: string;
}

export function createRoot(
  options?: CreateRootOptions,
): React.ComponentType<any>;
export function createRoot(
  UserApp?: React.ComponentType | null,
): React.ComponentType<any>;
export function createRoot(
  UserApp?: React.ComponentType | CreateRootOptions | null,
) {
  if (UserApp && typeof UserApp === 'object' && !('$$typeof' in UserApp)) {
    if (UserApp.route !== undefined) {
      throw new Error(
        'createRoot({ route }) must be statically defined in a Modern Module Federation expose with a registry import.',
      );
    }
    UserApp = undefined;
  }
  const definition = {
    ...getDefaultApplicationDefinition(),
    ...(UserApp ? { App: UserApp as React.ComponentType } : {}),
  };
  const ModernRoot = (props: Record<string, unknown>) => {
    const context = useContext(InternalRuntimeContext);
    const Root = context.application?.Root;
    if (!Root)
      throw new Error(
        'Modern Root must be rendered by its application instance',
      );
    return <Root {...props} />;
  };
  return registerApplicationRoot(ModernRoot, definition);
}
