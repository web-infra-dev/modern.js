import type React from 'react';

export type OnBeforeRenderFn<RuntimeContext> = (
  context: RuntimeContext,
  interrupt: (info: any) => void,
) => Promise<void> | void;

export type WrapRootFn = (
  root: React.ComponentType<any>,
) => React.ComponentType<any>;

export type PickContextFn<RuntimeContext> = (
  context: RuntimeContext,
) => RuntimeContext;

export type ModifyRuntimeConfigFn<RuntimeConfig> = (
  config: RuntimeConfig,
) => RuntimeConfig;
