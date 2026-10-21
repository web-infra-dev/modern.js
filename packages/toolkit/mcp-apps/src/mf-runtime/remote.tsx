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

export type MountComponent = (
  | ((container: HTMLElement, props: RemoteProps) => MountResult)
  | { mount: (container: HTMLElement, props: RemoteProps) => MountResult }
) & { update?: (props: RemoteProps) => void };

export type ReactRemoteComponent =
  React.ComponentType<RemoteProps> | React.ExoticComponent<RemoteProps>;
export type RemoteComponent = ReactRemoteComponent | MountComponent;

export type RemoteModule = {
  default?: RemoteComponent;
  [key: string]: unknown;
};

function isReactComponent(value: unknown): value is ReactRemoteComponent {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  const marker = (value as { $$typeof?: symbol }).$$typeof;
  return (
    marker === Symbol.for('react.memo') ||
    marker === Symbol.for('react.forward_ref') ||
    marker === Symbol.for('react.lazy')
  );
}

function isMountComponent(value: unknown): value is MountComponent {
  return (
    typeof value === 'function' ||
    (!!value &&
      typeof value === 'object' &&
      typeof (value as { mount?: unknown }).mount === 'function')
  );
}

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

  return resolveRemoteExport(remoteModule, exportName, config.renderMode);
}

/** Validate the selected export before React rendering or imperative mounting. */
export function resolveRemoteExport(
  remoteModule: unknown,
  exportName: string,
  renderMode: ModuleFederationConfig['renderMode'] = 'component',
): RemoteComponent {
  const record =
    remoteModule && typeof remoteModule === 'object'
      ? (remoteModule as Record<string, unknown>)
      : undefined;
  // Direct exports are supported only for the default export convention.
  const direct =
    typeof remoteModule === 'function' ||
    isReactComponent(remoteModule) ||
    (record && typeof record.mount === 'function');
  const selected =
    exportName === 'default' && direct
      ? remoteModule
      : record && Object.hasOwn(record, exportName)
        ? record[exportName]
        : undefined;
  const valid =
    renderMode === 'mount'
      ? isMountComponent(selected)
      : isReactComponent(selected);
  if (!valid) {
    throw new Error(
      `Export "${exportName}" is missing or invalid for ${renderMode} mode`,
    );
  }
  return selected as RemoteComponent;
}

/** Preserve receivers for module and instance lifecycle methods. */
export function mountRemoteComponent(
  remote: MountComponent,
  container: HTMLElement,
  props: RemoteProps,
) {
  let instance: MountResult;
  if ('mount' in remote && typeof remote.mount === 'function') {
    instance = remote.mount(container, props);
  } else if (typeof remote === 'function') {
    instance = remote(container, props);
  } else {
    throw new Error('Invalid remote mount export');
  }
  return {
    update(next: RemoteProps) {
      if (
        instance &&
        typeof instance === 'object' &&
        typeof instance.update === 'function'
      ) {
        instance.update(next);
      } else {
        remote.update?.(next);
      }
    },
    unmount() {
      if (typeof instance === 'function') instance();
      else instance?.unmount?.();
    },
  };
}

interface RemoteComponentContainerProps {
  config: ModuleFederationConfig;
  args?: RemoteProps;
  mcpApp?: App | null;
}

export function RemoteComponentContainer(props: RemoteComponentContainerProps) {
  const [attempt, setAttempt] = useState(0);
  const {
    remoteName,
    remoteEntry,
    module,
    exportName,
    renderMode = 'component',
  } = props.config;
  const identity = JSON.stringify([
    remoteName,
    remoteEntry,
    module,
    exportName,
    renderMode,
    attempt,
  ]);
  return (
    <RemoteComponentInstance
      key={identity}
      {...props}
      onRetry={() => setAttempt(value => value + 1)}
    />
  );
}

function RemoteComponentInstance({
  config,
  args = {},
  mcpApp = null,
  onRetry,
}: RemoteComponentContainerProps & { onRetry: () => void }) {
  const { component: RemoteComponent, error } = useRemoteComponent(config);
  const mountContainerRef = useRef<HTMLDivElement | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  const mountedRef = useRef<ReturnType<typeof mountRemoteComponent> | null>(
    null,
  );
  const lastPropsRef = useRef<{ args: RemoteProps; mcpApp: App | null } | null>(
    null,
  );
  const argsRef = useRef(args);
  const mcpAppRef = useRef(mcpApp);
  argsRef.current = args;
  mcpAppRef.current = mcpApp;
  const renderMode = config.renderMode ?? 'component';

  useEffect(() => {
    if (
      renderMode !== 'mount' ||
      !RemoteComponent ||
      !isMountComponent(RemoteComponent) ||
      !mountContainerRef.current
    ) {
      return;
    }

    setLifecycleError(null);
    try {
      const mounted = mountRemoteComponent(
        RemoteComponent,
        mountContainerRef.current,
        {
          ...argsRef.current,
          mcpApp: mcpAppRef.current,
        },
      );
      mountedRef.current = mounted;
      lastPropsRef.current = {
        args: argsRef.current,
        mcpApp: mcpAppRef.current,
      };
      return () => {
        mountedRef.current = null;
        lastPropsRef.current = null;
        try {
          mounted.unmount();
        } catch (error) {
          // Cleanup failures must not tear down the host connection.
          console.error('[MF App] Remote unmount failed:', error);
        }
      };
    } catch (error) {
      mountContainerRef.current.replaceChildren();
      setLifecycleError(error instanceof Error ? error.message : String(error));
    }
  }, [RemoteComponent, renderMode]);

  useEffect(() => {
    const mounted = mountedRef.current;
    if (renderMode !== 'mount' || !mounted) return;
    if (
      lastPropsRef.current?.args === args &&
      lastPropsRef.current?.mcpApp === mcpApp
    )
      return;
    lastPropsRef.current = { args, mcpApp };
    try {
      mounted.update({ ...args, mcpApp });
      setLifecycleError(null);
    } catch (error) {
      setLifecycleError(error instanceof Error ? error.message : String(error));
    }
  }, [args, mcpApp, renderMode]);

  const displayError = error ?? lifecycleError;
  const Component =
    renderMode === 'component' && isReactComponent(RemoteComponent)
      ? RemoteComponent
      : null;

  return (
    <div className="mf-content">
      <div className="mf-component-container">
        {/* Error State */}
        {displayError && (
          <div className="component-error-container">
            <div className="component-error-icon">❌</div>
            <div className="component-error-title">Component Load Error</div>
            <div className="component-error-message" role="alert">
              {displayError}
            </div>
            <button type="button" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}

        {!error && !RemoteComponent && <p role="status">Loading component…</p>}
        {/* Loaded Component */}
        {!error && Component && (
          <div data-component-container className="mf-component-wrapper">
            <ErrorBoundary>
              <Component {...args} mcpApp={mcpApp} />
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
  renderMode,
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
      config: { remoteName, remoteEntry, module, exportName, renderMode },
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
  }, [remoteName, remoteEntry, module, exportName, renderMode]);

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
