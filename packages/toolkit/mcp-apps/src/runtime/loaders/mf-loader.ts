import { createInstance } from '@module-federation/enhanced/runtime';
import * as reactExport from 'react';
import * as reactDOMExport from 'react-dom';
import * as reactDOMClientExport from 'react-dom/client';
import * as reactJsxDevRuntimeExport from 'react/jsx-dev-runtime';
import * as reactJsxRuntimeExport from 'react/jsx-runtime';
import type {
  ModuleFederationInstance,
  RemoteComponent,
  RemoteModule,
} from '../utils/remote-types.js';

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
  /** Ref holding the cached MF instance (reused across calls for the same remote) */
  mfInstanceRef: { current: ModuleFederationInstance | null };
  lastRemoteNameRef: { current: string };
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
  mfInstanceRef,
  lastRemoteNameRef,
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

  // ── Step 2: Create or reuse the MF instance ───────────────────────────────
  // The instance is cached per remote name. Re-creating it on every call
  // would cause React to see two separate instances, triggering
  // "Invalid hook call" errors inside remote components.
  let mf: ModuleFederationInstance;
  if (mfInstanceRef.current && lastRemoteNameRef.current === remoteName) {
    mf = mfInstanceRef.current;
  } else {
    addLog('🔧 Creating MF instance...');
    mf = createInstance({
      name: 'mcp-host',
      remotes: [{ name: remoteName, entry: remoteEntry }],
      shared: createReactSharedConfig(),
      shareStrategy: 'loaded-first',
    }) as ModuleFederationInstance;
    mfInstanceRef.current = mf;
    lastRemoteNameRef.current = remoteName;
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
