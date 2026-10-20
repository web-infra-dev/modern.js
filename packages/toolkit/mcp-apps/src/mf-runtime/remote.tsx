import type { App } from '@modelcontextprotocol/ext-apps';
import { useEffect, useRef, useState } from 'react';
import {
  loadRemoteComponent,
  type ModuleFederationConfig,
  type ModuleFederationInstance,
  type MountResult,
  type RemoteComponent,
  type RemoteProps,
} from './mf-loader';
import { ErrorBoundary } from './error-boundary';

interface RemoteComponentContainerProps {
  config: ModuleFederationConfig;
  args?: RemoteProps;
  mcpApp?: App | null;
}

export function RemoteComponentContainer({
  config,
  args = {},
  mcpApp = null,
}: RemoteComponentContainerProps) {
  const { component: RemoteComponent, error } = useRemoteComponent(config);
  const mountContainerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);
  const mountedModuleRef = useRef<RemoteComponent | null>(null);
  const mountedInstanceRef = useRef<MountResult>(undefined);
  const argsRef = useRef(args);
  const mcpAppRef = useRef(mcpApp);
  argsRef.current = args;
  mcpAppRef.current = mcpApp;
  const renderMode = config.renderMode ?? 'component';

  useEffect(() => {
    if (
      renderMode !== 'mount' ||
      !RemoteComponent ||
      !mountContainerRef.current
    ) {
      return;
    }

    const mountFn =
      typeof RemoteComponent.mount === 'function'
        ? RemoteComponent.mount
        : typeof RemoteComponent === 'function'
          ? RemoteComponent
          : null;

    if (!mountFn) {
      return;
    }

    const result = mountFn(mountContainerRef.current, {
      ...argsRef.current,
      mcpApp: mcpAppRef.current,
    });
    mountedModuleRef.current = RemoteComponent;
    mountedInstanceRef.current = result;
    if (typeof result === 'function') {
      cleanupRef.current = result;
    } else if (
      result &&
      typeof result === 'object' &&
      typeof result.unmount === 'function'
    ) {
      const unmount = result.unmount;
      cleanupRef.current = () => unmount();
    } else {
      cleanupRef.current = null;
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      mountedModuleRef.current = null;
      mountedInstanceRef.current = undefined;
    };
  }, [RemoteComponent, renderMode]);

  useEffect(() => {
    if (renderMode !== 'mount' || !mountedModuleRef.current) {
      return;
    }

    const mountedInstance = mountedInstanceRef.current;
    const updateFn =
      mountedInstance &&
      typeof mountedInstance === 'object' &&
      typeof mountedInstance.update === 'function'
        ? mountedInstance.update.bind(mountedInstance)
        : mountedModuleRef.current.update;
    if (typeof updateFn === 'function') {
      updateFn({
        ...args,
        mcpApp,
      });
    }
  }, [args, mcpApp, renderMode]);

  return (
    <div className="mf-content">
      <div className="mf-component-container">
        {/* Error State */}
        {error && (
          <div className="component-error-container">
            <div className="component-error-icon">❌</div>
            <div className="component-error-title">Component Load Error</div>
            <div className="component-error-message">{error}</div>
          </div>
        )}

        {/* Loaded Component */}
        {!error && RemoteComponent && renderMode !== 'mount' && (
          <div data-component-container className="mf-component-wrapper">
            <ErrorBoundary>
              <RemoteComponent {...args} mcpApp={mcpApp} />
            </ErrorBoundary>
          </div>
        )}
        {!error && RemoteComponent && renderMode === 'mount' && (
          <div
            ref={mountContainerRef}
            data-component-container
            className="mf-component-wrapper"
          />
        )}
      </div>
    </div>
  );
}

/** Reload only when module identity changes, keeping tool argument updates cheap. */
function useRemoteComponent({
  remoteName,
  remoteEntry,
  module,
  exportName,
}: ModuleFederationConfig) {
  const [component, setComponent] = useState<RemoteComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const instances = useRef(new Map<string, ModuleFederationInstance>());

  useEffect(() => {
    let active = true;
    setComponent(null);
    setError(null);
    const timer = setTimeout(() => {
      active = false;
      setError(`Load timeout after 30000ms: ${remoteName}/${module}`);
    }, 30000);

    loadRemoteComponent({
      config: { remoteName, remoteEntry, module, exportName },
      instances: instances.current,
    }).then(
      loaded => {
        clearTimeout(timer);
        if (active) setComponent(() => loaded);
      },
      error => {
        clearTimeout(timer);
        if (active)
          setError(error instanceof Error ? error.message : String(error));
      },
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [remoteName, remoteEntry, module, exportName]);

  return { component, error };
}
