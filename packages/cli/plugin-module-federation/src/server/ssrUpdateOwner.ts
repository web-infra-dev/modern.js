import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { SSREntryRecord } from './ssrUpdate';

export interface SSRUpdateOwner {
  readonly id: string;
  readonly name: string;
  readonly entries: Map<string, SSREntryRecord>;
  readonly instances: Set<any>;
  readonly entryNames: Set<string>;
  registrations?: any[];
}
const key = Symbol.for('modern-js.mf.ssr.owners');
export const runtimeOwnerKey = Symbol.for('modern-js.mf.ssr.runtime-owner');
function protocol(): {
  context: AsyncLocalStorage<SSRUpdateOwner>;
  owners: Map<string, SSRUpdateOwner>;
  registerEntry(record: SSREntryRecord): void;
} {
  return ((globalThis as any)[key] ||= {
    context: new AsyncLocalStorage<SSRUpdateOwner>(),
    owners: new Map<string, SSRUpdateOwner>(),
    registerEntry(record: SSREntryRecord) {
      const owner = currentSSRUpdateOwner();
      // A remote producer's bundle can execute inside its consumer's load.
      if (
        !owner ||
        owner.name !== record.application ||
        !owner.entryNames.has(record.entry)
      )
        return;
      const previous = record.runtime[runtimeOwnerKey];
      if (previous && previous !== owner)
        throw new Error(
          'Compiled SSR runtime already belongs to another application',
        );
      // Rspack can expose distinct require facades over one runtime context.
      // Ordinary property assignment crosses that facade; defineProperty does not.
      record.runtime[runtimeOwnerKey] = owner;
      record.applicationOwner = owner.id;
      Object.defineProperty(record, 'buildId', {
        enumerable: true,
        get: () => record.runtime.federation?.instance?.options.id,
      });
      owner.entries.set(record.entry, record);
    },
  });
}
export function createSSRUpdateOwner(
  name: string,
  entries: string[] = [],
): SSRUpdateOwner {
  const owner = {
    id: randomUUID(),
    name,
    entries: new Map(),
    instances: new Set(),
    entryNames: new Set(
      entries.flatMap(entry => [entry, `${entry}-server-loaders`]),
    ),
  };
  protocol().owners.set(owner.id, owner);
  return owner;
}
export function currentSSRUpdateOwner() {
  return protocol().context.getStore();
}
export function ownerOfSSRRuntime(runtime: object | undefined) {
  return runtime
    ? ((runtime as any)[runtimeOwnerKey] as SSRUpdateOwner | undefined)
    : undefined;
}
export function getSSRUpdateOwner(id?: string) {
  return id ? protocol().owners.get(id) : currentSSRUpdateOwner();
}
export function runWithSSRUpdateOwner<T>(
  owner: SSRUpdateOwner,
  run: () => T,
): T {
  return protocol().context.run(owner, run);
}
export function bindSSRRuntime(owner: SSRUpdateOwner, instance: any) {
  const previous = instance[runtimeOwnerKey];
  if (previous && previous !== owner)
    throw new Error('MF runtime already belongs to another SSR application');
  Object.defineProperty(instance, runtimeOwnerKey, {
    value: owner,
    configurable: true,
  });
  owner.instances.add(instance);
}
export function releaseSSRUpdateOwner(owner: SSRUpdateOwner) {
  protocol().owners.delete(owner.id);
  for (const record of owner.entries.values())
    record.runtime[runtimeOwnerKey] = undefined;
  owner.entries.clear();
  owner.instances.clear();
  owner.registrations = undefined;
}
