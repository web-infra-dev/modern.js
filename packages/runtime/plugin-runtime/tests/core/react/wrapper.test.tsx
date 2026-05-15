import React, { useContext } from 'react';
import { renderToString } from 'react-dom/server';
import {
  getInitialContext,
  InternalRuntimeContext,
  RuntimeContext,
} from '../../../src/core/context';
import { wrapRuntimeContextProvider } from '../../../src/core/react/wrapper';

describe('wrapRuntimeContextProvider', () => {
  it('should keep routerServerSnapshot internal-only', () => {
    let runtimeValue: Record<string, unknown> | undefined;
    let internalValue: Record<string, unknown> | undefined;

    const Probe = () => {
      runtimeValue = useContext(RuntimeContext) as Record<string, unknown>;
      internalValue = useContext(InternalRuntimeContext) as Record<
        string,
        unknown
      >;
      return null;
    };

    const context = getInitialContext(false);
    context.routerFramework = 'custom-router';
    context.routerInstance = { kind: 'internal-router' };
    context.routerServerSnapshot = {
      matchedRouteIds: ['route-a'],
    };

    renderToString(
      wrapRuntimeContextProvider(
        <Probe />,
        context as Record<string, unknown> as any,
      ),
    );

    expect(internalValue?.routerServerSnapshot).toEqual({
      matchedRouteIds: ['route-a'],
    });
    expect(internalValue?.routerFramework).toBe('custom-router');
    expect(internalValue?.routerInstance).toEqual({
      kind: 'internal-router',
    });
    expect(runtimeValue?.routerFramework).toBe('custom-router');
    expect(runtimeValue?.routerInstance).toBeUndefined();
    expect(runtimeValue?.routerServerSnapshot).toBeUndefined();
  });
});
