import {
  parseEntry,
  type moduleFederationPlugin,
} from '@module-federation/sdk';
import type { createInstance } from '@module-federation/enhanced/runtime';

export type ServiceRemote = NonNullable<
  Parameters<typeof createInstance>[0]['remotes']
>[number];

/** Only build-configured remotes may be selected by the same-origin ingress. */
export function serviceRemotes(
  configured: moduleFederationPlugin.Remotes = {},
): ServiceRemote[] {
  const result: ServiceRemote[] = [];
  const add = (
    alias: string,
    value: moduleFederationPlugin.RemotesObject[string],
  ) => {
    const external =
      typeof value === 'object' && !Array.isArray(value)
        ? value.external
        : value;
    const entries = Array.isArray(external) ? external : [external];
    for (const entry of entries) {
      // Promise/expression externals are executable code, not deployment URLs.
      // They remain available to ordinary MF consumers, never to this ingress.
      if (/\s/.test(entry)) continue;
      const remote = /^https?:\/\//.test(entry)
        ? { name: alias, entry }
        : parseEntry(entry, undefined, '@');
      result.push({ ...remote, alias });
      break;
    }
  };
  for (const item of Array.isArray(configured) ? configured : [configured]) {
    if (typeof item === 'string') add(item, item);
    else for (const [alias, value] of Object.entries(item)) add(alias, value);
  }
  return result;
}
