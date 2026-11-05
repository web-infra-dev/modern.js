import { SHELL_ELEMENT_ID } from './inject';
import type { AppShellEntryOptions, AppShellRuntimeConfig } from './types';

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_SHELL_INPUT = '[data-app-shell-input]';

export const toRuntimeConfig = (
  options: AppShellEntryOptions,
  mountId: string,
): AppShellRuntimeConfig => ({
  id: SHELL_ELEMENT_ID,
  mountId,
  routes: options.routes
    ? options.routes.map(route =>
        typeof route === 'string'
          ? { exact: route }
          : { pattern: route.source, flags: route.flags },
      )
    : null,
  readySelector: options.readySelector ?? null,
  readyHold: options.readyHold ?? (options.input === false ? 0 : 200),
  timeout: options.timeout ?? DEFAULT_TIMEOUT,
  input:
    options.input === false
      ? null
      : {
          shell: options.input?.shell ?? DEFAULT_SHELL_INPUT,
          target: options.input?.target ?? null,
          autofocus: options.input?.autofocus ?? false,
          settle: options.input?.settle ?? 3000,
        },
  deferStylesheets: options.deferStylesheets ?? false,
});
