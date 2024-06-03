/* eslint-disable node/no-unsupported-features/es-builtins */
import type { Buffer } from 'buffer';
import { BaseHooks } from '@modern-js/core';
import type {
  AppTools,
  AppToolsHooks,
  CliPlugin,
  UserConfig,
} from '@modern-js/app-tools';
import type { ServerPlugin, ToThreads } from '@modern-js/server-core';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import { Hookable } from 'hookable';

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
    | 'beforeRestart'
    | 'beforeExit'
  >
>;

export interface FrameworkHooks extends $FrameworkHooks {
  config: (config: UserConfig<AppTools>) => void;
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
  >
>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BuilderHooks extends $BuilderHooks {}

export interface PluginApi {
  frameworkHooks: Hookable<FrameworkHooks>;
  builderHooks: Hookable<BuilderHooks>;
  setupFramework: () => Promise<CliPluginAPI>;
  setupBuilder: () => Promise<RsbuildPluginAPI>;
}

export interface Plugin {
  setup: (api: PluginApi) => Promise<void>;
}
