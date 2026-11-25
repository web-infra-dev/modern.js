import {
  createRemoteManifestReader,
  type RemoteCheckOptions,
  type RemoteUpdateTarget,
} from './remoteUpdate';
import {
  DEV_MANIFEST_WAIT_TIMEOUT,
  anyAbortSignal,
} from '../ssr-runtime/devManifestWait';
import {
  debugMFSSR,
  extractTargetVersion,
  isMFSSRDebugEnabled,
} from './ssrLogger';

export type DevRemoteUpdateTrigger = 'hmr-check' | 'request' | 'recover';

export class DevRemoteUnavailableError extends Error {}

export interface DevRemoteUpdatesOptions {
  remotes:
    readonly RemoteUpdateTarget[] | (() => readonly RemoteUpdateTarget[]);
  dependencies?(remote: RemoteUpdateTarget): readonly RemoteUpdateTarget[];
  self?: { name: string; entry: string };
  shouldUpdateRemote(
    remote: RemoteUpdateTarget,
    options: RemoteCheckOptions,
  ): Promise<boolean>;
  updateRemotes(
    remotes: RemoteUpdateTarget[],
    options: RemoteCheckOptions,
  ): Promise<unknown>;
  onUpdating?(
    remotes: RemoteUpdateTarget[],
    trigger?: DevRemoteUpdateTrigger,
  ): void;
  onApplied(remotes: RemoteUpdateTarget[]): void;
  onError(error: unknown): void;
  checkTimeoutMs?: number;
  requestTimeoutMs?: number;
}

function identity(remote: { name: string; entry: string }) {
  const url = new URL(remote.entry);
  url.hash = '';
  return JSON.stringify([remote.name, url.href]);
}
const isManifest = (remote: RemoteUpdateTarget) =>
  /^https?:\/\/.*\.json(?:[?#]|$)/.test(remote.entry);

/** Browser hints and incoming SSR requests use the same check/update queue.
 * No publisher acknowledgements or dependency readiness is propagated. */
export function startDevRemoteUpdates(options: DevRemoteUpdatesOptions) {
  const lifetime = new AbortController();
  const read = createRemoteManifestReader({ waitForDevReady: true });
  let checking: Promise<void> | undefined;
  let requested = 0;
  let checked = 0;
  let pendingTrigger: DevRemoteUpdateTrigger = 'request';
  const roots = () => {
    const configured =
      typeof options.remotes === 'function'
        ? options.remotes()
        : options.remotes;
    return configured.filter(
      remote =>
        isManifest(remote) &&
        (!options.self || identity(remote) !== identity(options.self)),
    );
  };
  const apply = async (trigger: DevRemoteUpdateTrigger) => {
    const started = isMFSSRDebugEnabled() ? performance.now() : 0;
    const deadline = AbortSignal.timeout(
      options.checkTimeoutMs ?? DEV_MANIFEST_WAIT_TIMEOUT,
    );
    const signal = anyAbortSignal([lifetime.signal, deadline]);
    const reads = new Map<
      string,
      Promise<import('@module-federation/sdk').Manifest>
    >();
    const readOnce = (remote: RemoteUpdateTarget) => {
      let pending = reads.get(remote.entry);
      if (!pending) {
        // Never reuse a previously applied manifest/moduleInfo as a fresh HTTP candidate.
        pending = read(
          { ...remote, manifest: undefined, moduleInfo: undefined },
          { signal },
        );
        reads.set(remote.entry, pending);
      }
      return pending;
    };
    const checkedRemotes: string[] = [];
    const changes = await Promise.all(
      roots().map(async remote => {
        const manifest = await readOnce(remote);
        if (isMFSSRDebugEnabled()) {
          const ver = extractTargetVersion({ manifest });
          checkedRemotes.push(ver ? `${remote.name}@${ver}` : remote.name);
        }
        const visited = new Set([identity(remote)]);
        if (options.self) visited.add(identity(options.self));
        const dependencies: NonNullable<RemoteUpdateTarget['dependencies']> =
          [];
        const pending = [...(options.dependencies?.(remote) || [])];
        const discover = (info: import('@module-federation/sdk').Manifest) => {
          for (const dependency of (info.remotes || []) as any[]) {
            if (
              typeof dependency.federationContainerName === 'string' &&
              typeof dependency.entry === 'string'
            )
              pending.push({
                name: dependency.federationContainerName,
                entry: dependency.entry,
              });
          }
        };
        discover(manifest);
        for (const dependency of pending) {
          if (!isManifest(dependency) || visited.has(identity(dependency)))
            continue;
          visited.add(identity(dependency));
          const info = await readOnce(dependency);
          const buildVersion = (info.metaData as any)?.buildInfo?.buildVersion;
          if (typeof buildVersion !== 'string' || !buildVersion)
            throw new Error(
              `Remote manifest has no buildVersion: ${dependency.entry}`,
            );
          dependencies.push({
            name: dependency.name,
            entry: dependency.entry,
            buildVersion,
          });
          discover(info);
        }
        dependencies.sort((a, b) => identity(a).localeCompare(identity(b)));
        const { moduleInfo: _moduleInfo, ...baseRemote } =
          remote as RemoteUpdateTarget;
        const candidate = { ...baseRemote, manifest, dependencies };
        return (await options.shouldUpdateRemote(candidate, { signal }))
          ? candidate
          : undefined;
      }),
    );
    const targets = changes.filter(
      (
        value,
      ): value is RemoteUpdateTarget & {
        manifest: import('@module-federation/sdk').Manifest;
        dependencies: NonNullable<RemoteUpdateTarget['dependencies']>;
      } => !!value,
    );
    lifetime.signal.throwIfAborted();
    if (!targets.length) {
      if (checkedRemotes.length) {
        debugMFSSR('check-noop', {
          trigger,
          remotes: checkedRemotes,
          durationMs: started ? performance.now() - started : undefined,
        });
      }
      return;
    }
    options.onUpdating?.(targets, trigger);
    // HTTP candidate deadlines do not cancel the drain of existing SSR work.
    await options.updateRemotes(targets, { signal: lifetime.signal });
    options.onApplied(targets);
  };
  const check = (trigger: DevRemoteUpdateTrigger = 'request') => {
    if (lifetime.signal.aborted)
      return Promise.reject(
        new DevRemoteUnavailableError('Development update owner is closed'),
      );
    if (!checking) {
      pendingTrigger = trigger;
      checking = (async () => {
        do {
          const revision = requested;
          const currentTrigger = pendingTrigger;
          await apply(currentTrigger);
          checked = revision;
        } while (checked !== requested);
      })()
        .catch(error => {
          if (!lifetime.signal.aborted) options.onError(error);
          throw new DevRemoteUnavailableError(
            error instanceof Error ? error.message : 'Node SSR update failed',
          );
        })
        .finally(() => {
          checking = undefined;
        });
    }
    return checking;
  };
  return {
    /** A hint arriving during a check schedules another pass before admission. */
    notify(trigger: DevRemoteUpdateTrigger = 'hmr-check') {
      pendingTrigger = trigger;
      requested++;
      return check(trigger);
    },
    check(request?: Request): Promise<void> {
      const pending = check('request');
      if (!request) return pending;
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (reason?: unknown) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          request.signal.removeEventListener('abort', abort);
          lifetime.signal.removeEventListener('abort', closed);
          if (reason !== undefined) reject(reason);
          else resolve();
        };
        const abort = () => finish(request.signal.reason);
        const closed = () =>
          finish(
            new DevRemoteUnavailableError('Development update owner is closed'),
          );
        const timer = setTimeout(
          () =>
            finish(
              new DevRemoteUnavailableError('Remote build readiness timed out'),
            ),
          options.requestTimeoutMs ?? DEV_MANIFEST_WAIT_TIMEOUT,
        );
        request.signal.addEventListener('abort', abort, { once: true });
        lifetime.signal.addEventListener('abort', closed, { once: true });
        if (request.signal.aborted) abort();
        else if (lifetime.signal.aborted) closed();
        pending.then(() => finish(), finish);
      });
    },
    async close() {
      lifetime.abort();
      await checking?.catch(() => {});
    },
  };
}
