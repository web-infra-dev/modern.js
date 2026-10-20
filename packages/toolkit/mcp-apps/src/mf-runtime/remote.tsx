import { createInstance } from '@module-federation/enhanced/runtime';
import * as reactExport from 'react';
import React, { useEffect, useRef, useState } from 'react';
import type { App } from '@modelcontextprotocol/ext-apps';
import * as reactDOMExport from 'react-dom';
import * as reactDOMClientExport from 'react-dom/client';
import * as reactJsxDevRuntimeExport from 'react/jsx-dev-runtime';
import * as reactJsxRuntimeExport from 'react/jsx-runtime';

export type RemoteProps = Record<string, unknown>;

export type MountResult =
  | undefined
  | (() => void)
  | {
      unmount?: () => void;
      update?: (props: RemoteProps) => void;
    };

export type RemoteModule = {
  default?: RemoteComponent;
  [key: string]: unknown;
};

export type RemoteComponent = {
  (props: RemoteProps): React.ReactNode;
  (container: HTMLElement, props: RemoteProps): MountResult;
  mount?: (container: HTMLElement, props: RemoteProps) => MountResult;
  update?: (props: RemoteProps) => void;
};

export type ModuleFederationInstance = {
  loadRemote: (path: string) => Promise<RemoteModule | RemoteComponent>;
};

const REACT_COMPAT_RANGE = '^17 || ^18 || ^19';

function getPackageVersion(
  pkg: { version?: string },
  fallback: string,
): string {
  return typeof pkg.version === 'string' && pkg.version.length > 0
    ? pkg.version
    : fallback;
}

function createReactSharedConfig() {
  const reactVersion = getPackageVersion(reactExport, REACT_COMPAT_RANGE);
  const reactDomVersion = getPackageVersion(reactDOMExport, REACT_COMPAT_RANGE);

  return {
    react: {
      version: reactVersion,
      scope: 'default',
      lib: () => reactExport,
      shareConfig: {
        singleton: true,
        requiredVersion: REACT_COMPAT_RANGE,
      },
    },
    'react/jsx-runtime': {
      version: reactVersion,
      scope: 'default',
      lib: () => reactJsxRuntimeExport,
      shareConfig: {
        singleton: true,
        requiredVersion: REACT_COMPAT_RANGE,
      },
    },
    'react/jsx-dev-runtime': {
      version: reactVersion,
      scope: 'default',
      lib: () => reactJsxDevRuntimeExport,
      shareConfig: {
        singleton: true,
        requiredVersion: REACT_COMPAT_RANGE,
      },
    },
    'react-dom': {
      version: reactDomVersion,
      scope: 'default',
      lib: () => reactDOMExport,
      shareConfig: {
        singleton: true,
        requiredVersion: REACT_COMPAT_RANGE,
      },
    },
    'react-dom/client': {
      version: reactDomVersion,
      scope: 'default',
      lib: () => reactDOMClientExport,
      shareConfig: { singleton: true, requiredVersion: REACT_COMPAT_RANGE },
    },
  };
}

export interface ModuleFederationConfig {
  remoteName: string;
  remoteEntry: string;
  module: string;
  exportName: string;
  renderMode?: 'component' | 'mount';
}

export interface LoadRemoteOptions {
  config: ModuleFederationConfig;
  instances: Map<string, ModuleFederationInstance>;
}

/**
 * Load a remote Module Federation component.
 *
 * Uses the standard Module Federation manifest directly.
 *
 * Reuses the existing MF instance when the same remote is requested again,
 * preventing React multi-instance errors ("Invalid hook call").
 *
 * @returns The resolved React component (or module export)
 */
export async function loadRemoteComponent({
  config,
  instances,
}: LoadRemoteOptions): Promise<RemoteComponent> {
  const {
    remoteName,
    remoteEntry: rawRemoteEntry,
    module: modulePath,
    exportName,
  } = config;

  const remoteEntry = rawRemoteEntry.startsWith('//')
    ? `https:${rawRemoteEntry}`
    : rawRemoteEntry;

  // A remote's name and entry jointly identify its runtime instance.
  const key = JSON.stringify([remoteName, remoteEntry]);
  let mf = instances.get(key);
  if (!mf) {
    mf = createInstance({
      name: 'mcp-host',
      remotes: [{ name: remoteName, entry: remoteEntry }],
      shared: createReactSharedConfig(),
      shareStrategy: 'loaded-first',
    }) as ModuleFederationInstance;
    instances.set(key, mf);
  }

  // ── Step 3: Load the remote module ───────────────────────────────────────
  // Normalize module path:
  //   './Foo'  → 'moduleNameA/Foo'
  //   './'     → 'moduleNameA'        (root expose, trailing slash variant)
  //   '.'      → 'moduleNameA'        (root expose, e.g. exposes: { '.': './src/index' })
  const normalizedPath = modulePath.replace(/^\.\//, '');
  const fullPath =
    normalizedPath === '' || normalizedPath === '.'
      ? remoteName
      : `${remoteName}/${normalizedPath}`;

  const remoteModule = await mf.loadRemote(fullPath);

  const moduleRecord =
    typeof remoteModule === 'object'
      ? (remoteModule as Record<string, unknown>)
      : null;
  const Component =
    moduleRecord !== null
      ? moduleRecord[exportName] || moduleRecord.default || remoteModule
      : remoteModule;

  if (!Component) {
    throw new Error(`Export "${exportName}" not found in remote module`);
  }

  return Component as RemoteComponent;
}

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

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🛡️ ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <h1 className="error-boundary-title">🛡️ Error caught!</h1>
          <div className="error-boundary-message-wrapper">
            <h2 className="error-boundary-message-title">Error:</h2>
            <pre className="error-boundary-message-content">
              {this.state.error?.toString()}
            </pre>
          </div>
          {this.state.error?.stack && (
            <div className="error-boundary-stack-wrapper">
              <h2 className="error-boundary-stack-title">Stack trace:</h2>
              <pre className="error-boundary-stack-content">
                {this.state.error.stack}
              </pre>
            </div>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="error-boundary-reload-btn"
          >
            🔄 Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
