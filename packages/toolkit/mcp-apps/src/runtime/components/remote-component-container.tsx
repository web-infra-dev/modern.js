import type { App } from '@modelcontextprotocol/ext-apps';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useRemoteComponent } from '../hooks/useRemoteComponent.js';
import type { ModuleFederationConfig } from '../loaders/mf-loader.js';
import type {
  MountResult,
  RemoteComponent,
  RemoteProps,
} from '../utils/remote-types.js';
import { ErrorBoundary } from './error-boundary.js';
import '../styles/component-renderer.css';

export interface RemoteComponentContainerProps {
  /**
   * Module Federation configuration for loading the remote component.
   * Must include remoteName, remoteEntry, module, exportName, and manifestType.
   */
  config: ModuleFederationConfig;

  /**
   * Props to pass to the loaded remote component.
   * These are spread as component props: <RemoteComponent {...args} />
   */
  args?: RemoteProps;

  /**
   * Optional MCP App instance to pass as `mcpApp` prop to the component.
   * This allows the remote component to communicate with the MCP host.
   */
  mcpApp?: App | null;

  /**
   * Optional callback to log messages during loading.
   */
  onLog?: (msg: string) => void;

  /**
   * Custom error UI. Defaults to error details with stack trace.
   * Receives error message as string.
   */
  errorFallback?: (error: string) => React.ReactNode;

  /**
   * Custom wrapper class name for the component container.
   */
  className?: string;

  /**
   * Optional dependency array to trigger reload.
   * If provided, component reloads when deps change.
   */
  deps?: React.DependencyList;
}

/**
 * Container component for rendering remote Module Federation components.
 *
 * This is the easiest way to load and render a remote component.
 * It handles loading, error states, and passes props/mcpApp automatically.
 *
 * @example
 * ```tsx
 * <MFProvider>
 *   <RemoteComponentContainer
 *     config={{
 *       remoteName: 'my_remote',
 *       remoteEntry: 'http://localhost:8080/mf-manifest.json',
 *       module: './MyComponent',
 *       exportName: 'default',
 *       manifestType: 'mf',
 *     }}
 *     args={{ title: 'Hello' }}
 *     mcpApp={app}
 *     onLog={console.log}
 *   />
 * </MFProvider>
 * ```
 */
export function RemoteComponentContainer({
  config,
  args = {},
  mcpApp = null,
  onLog,
  errorFallback,
  className,
  deps,
}: RemoteComponentContainerProps) {
  const { component: RemoteComponent, error } = useRemoteComponent({
    config,
    onLog,
    deps,
  });
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
    <div className={className || 'mf-content'}>
      <div className="mf-component-container">
        {/* Error State */}
        {error &&
          (errorFallback ? (
            errorFallback(error)
          ) : (
            <div className="component-error-container">
              <div className="component-error-icon">❌</div>
              <div className="component-error-title">Component Load Error</div>
              <div className="component-error-message">{error}</div>
            </div>
          ))}

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
