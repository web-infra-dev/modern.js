/* eslint-disable node/no-unsupported-features/es-builtins */
import type { Buffer } from 'buffer';
import { BaseHooks } from '@modern-js/core';
import type { BuilderPluginAPI as WebpackBuilderAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderAPI } from '@modern-js/builder-rspack-provider';
import type { AppTools, AppToolsHooks, CliPlugin } from '@modern-js/app-tools';
import type { ServerPlugin, ToThreads } from '@modern-js/server-core';

export type CliPluginAPI = Parameters<
  NonNullable<CliPlugin<AppTools>['setup']>
>[0];

export type ServerPluginAPI = Parameters<NonNullable<ServerPlugin['setup']>>[0];

export type BuilderPluginAPI = WebpackBuilderAPI | RspackBuilderAPI;
// export type BuilderPluginAPI = DefaultBuilderPluginAPI;

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

export type Hooks = BaseHooks<any> & AppToolsHooks<any>;

export type InjectedHooks = Pick<
  ToThreads<Hooks>,
  'prepare' | 'modifyFileSystemRoutes'
>;
