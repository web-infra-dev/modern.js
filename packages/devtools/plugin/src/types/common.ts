/* eslint-disable node/no-unsupported-features/es-builtins */
import type { Buffer } from 'buffer';
import { BaseHooks } from '@modern-js/core';
import type { AppTools, AppToolsHooks, CliPlugin } from '@modern-js/app-tools';
import type { ServerPlugin, ToThreads } from '@modern-js/server-core';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import { Hookable } from 'hookable';
import { DevtoolsContext } from '@modern-js/devtools-kit/node';

export type CliPluginAPI = Parameters<
  NonNullable<CliPlugin<AppTools>['setup']>
>[0];

export type ServerPluginAPI = Parameters<NonNullable<ServerPlugin['setup']>>[0];

export type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | ReadonlyArray<any>
  | ReadonlyArray<number>
  | { valueOf: () => ArrayBuffer }
  | { valueOf: () => SharedArrayBuffer }
  | { valueOf: () => Uint8Array }
  | { valueOf: () => ReadonlyArray<number> }
  | { valueOf: () => string }
  | { [Symbol.toPrimitive]: (hint: string) => string };

export type CleanHooks<T> = {
  [K in keyof T]: T[K] extends (...args: [...infer Params]) => any
    ? (...args: [...Params]) => void
    : never;
};

export type $FrameworkHooks = CleanHooks<
  Pick<
    ToThreads<BaseHooks<any> & AppToolsHooks<any>>,
    | 'prepare'
    | 'modifyFileSystemRoutes'
    | 'modifyServerRoutes'
    | 'afterCreateCompiler'
    | 'afterDev'
    | 'beforeRestart'
    | 'beforeExit'
    | 'afterBuild'
  >
>;

export interface FrameworkHooks extends $FrameworkHooks {
  config: () => void;
}

type UnwrapBuilderHooks<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any
    ? (...params: [...Parameters<Parameters<T[K]>[0]>]) => void
    : never;
};

export type $BuilderHooks = UnwrapBuilderHooks<
  Pick<
    RsbuildPluginAPI,
    | 'modifyBundlerChain'
    | 'modifyWebpackConfig'
    | 'modifyRspackConfig'
    | 'onBeforeCreateCompiler'
    | 'onAfterCreateCompiler'
    | 'onDevCompileDone'
    | 'onAfterBuild'
    | 'onExit'
  >
>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BuilderHooks extends $BuilderHooks {}

export interface DevtoolsHooks {
  cleanup: () => Promise<void> | void;
  settleState: () => Promise<void> | void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DevtoolsPluginVars extends Record<string, unknown> {}
}

export interface PluginApi {
  builderHooks: Hookable<BuilderHooks>;
  frameworkHooks: Hookable<FrameworkHooks>;
  hooks: Hookable<DevtoolsHooks>;
  setupFramework: () => Promise<CliPluginAPI>;
  setupBuilder: () => Promise<RsbuildPluginAPI>;
  context: DevtoolsContext;
  vars: DevtoolsPluginVars;
}

export interface Plugin {
  setup: (api: PluginApi) => Promise<void>;
}
