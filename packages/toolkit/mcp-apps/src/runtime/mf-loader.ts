import { createInstance } from '@module-federation/enhanced/runtime';
import * as reactExport from 'react';
import * as reactDOMExport from 'react-dom';
import * as reactDOMClientExport from 'react-dom/client';
import * as reactJsxDevRuntimeExport from 'react/jsx-dev-runtime';
import * as reactJsxRuntimeExport from 'react/jsx-runtime';
import type React from 'react';

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
  addLog: (msg: string) => void;
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
  addLog,
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
  addLog(`📋 Using MF manifest: ${remoteEntry}`);

  // A remote's name and entry jointly identify its runtime instance.
  const key = JSON.stringify([remoteName, remoteEntry]);
  let mf = instances.get(key);
  if (!mf) {
    addLog('Creating MF instance...');
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

  addLog(`📦 Loading remote module: ${fullPath}`);

  let remoteModule: RemoteModule | RemoteComponent;
  try {
    remoteModule = await mf.loadRemote(fullPath);
  } catch (loadErr: unknown) {
    const message =
      loadErr instanceof Error ? loadErr.message : String(loadErr);
    addLog(`❌ Load failed: ${message}`);
    throw loadErr;
  }

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
