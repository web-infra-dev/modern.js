import type { App } from '@modelcontextprotocol/ext-apps';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadRemoteComponent,
  type ModuleFederationConfig,
  type ModuleFederationInstance,
  type MountResult,
  type RemoteComponent,
  type RemoteProps,
} from './mf-loader';
import { ErrorBoundary } from './error-boundary';

export interface RemoteComponentContainerProps {
  /**
   * Module Federation configuration for loading the remote component.
   * Must include remoteName, remoteEntry, module, and exportName.
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

interface UseRemoteComponentOptions {
  config: ModuleFederationConfig;
  onLog?: (msg: string) => void;
  /** Timeout for remote loading in milliseconds (default: 30000) */
  loadTimeoutMs?: number;
  /**
   * Dependency array to trigger reload.
   * If not provided, component loads once on mount.
   * If provided, component reloads when deps change.
   */
  deps?: React.DependencyList;
}

interface UseRemoteComponentResult {
  /** The loaded React component, or null if still loading/error */
  component: RemoteComponent | null;
  /** Whether the component is currently loading */
  isLoading: boolean;
  /** Error message if loading failed, or null */
  error: string | null;
  /** Manually trigger a reload of the component */
  reload: () => void;
}

function useRemoteComponent({
  config,
  onLog,
  loadTimeoutMs = 30000,
  deps,
}: UseRemoteComponentOptions): UseRemoteComponentResult {
  const [component, setComponent] = useState<RemoteComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const instances = useRef(new Map<string, ModuleFederationInstance>());
  const { remoteName, remoteEntry, module, exportName } = config;

  const onLogRef = useRef(onLog);

  useEffect(() => {
    onLogRef.current = onLog;
  }, [onLog]);

  const addLog = useCallback((msg: string) => {
    if (onLogRef.current) {
      const timestamp = new Date().toLocaleTimeString();
      onLogRef.current(`[${timestamp}] ${msg}`);
    }
  }, []);

  // Compute effective dependencies
  const effectDeps = deps ?? [];

  // Effect to load the component
  useEffect(() => {
    void reloadKey;
    let isMounted = true;

    const loadComponent = async () => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      try {
        setIsLoading(true);
        setError(null);
        setComponent(null);

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new Error(
                `Load timeout after ${loadTimeoutMs}ms: ${remoteName}/${module}`,
              ),
            );
          }, loadTimeoutMs);
        });

        const loadedComponent = await Promise.race([
          loadRemoteComponent({
            config: { remoteName, remoteEntry, module, exportName },
            addLog,
            instances: instances.current,
          }),
          timeoutPromise,
        ]);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (isMounted) {
          setComponent(() => loadedComponent);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          addLog(`❌ Load failed: ${errorMsg}`);
          setError(errorMsg);
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [
    remoteName,
    remoteEntry,
    module,
    exportName,
    addLog,
    loadTimeoutMs,
    reloadKey,
    ...effectDeps,
  ]);

  const reload = useCallback(() => {
    setReloadKey(k => k + 1);
  }, []);

  return { component, isLoading, error, reload };
}
