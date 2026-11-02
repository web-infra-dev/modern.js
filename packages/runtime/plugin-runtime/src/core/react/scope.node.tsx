import React, { useContext } from 'react';
import {
  PreparedScopeContext,
  PreparedScopedRoot,
  registerScopedRoot,
  type ScopedRootDefinition,
} from './scopeDefinition';
export type { ScopedRootDefinition } from './scopeDefinition';
export { getScopedRootDefinition } from './scopeDefinition';

export function createScopedRoot(
  definition: ScopedRootDefinition,
): React.ComponentType<any> {
  function ModernScopedRoot(props: Record<string, unknown>) {
    const prepared = useContext(PreparedScopeContext);
    if (prepared?.definition !== definition)
      throw new Error(
        'A server Modern application Root must be rendered through renderStream.',
      );
    return <PreparedScopedRoot instance={prepared} props={props} />;
  }
  return registerScopedRoot(ModernScopedRoot, definition);
}
export function createScopedRender() {
  return () => {
    throw new Error('A server Modern application cannot mount into a DOM.');
  };
}
