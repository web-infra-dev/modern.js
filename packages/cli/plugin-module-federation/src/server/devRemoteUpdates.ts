import {
  createDevBuildConnection,
  type DevBuildPublication,
  type DevBuildRemote,
  type DevBuildSource,
  type DevBuildStatus,
} from '@module-federation/enhanced/rspack';
import {
  createRemoteManifestReader,
  RemoteManifestUnavailableError,
  type RemoteCheckOptions,
  type RemoteUpdateTarget,
} from './remoteUpdate';
import { DEV_MANIFEST_WAIT_TIMEOUT } from '../ssr-runtime/devManifestWait';

export class DevRemoteUnavailableError extends Error {}

export interface DevRemoteUpdatesOptions {
  remotes: readonly RemoteUpdateTarget[];
  build?: {
    publisher(): DevBuildRemote;
    setReady?(ready: boolean): void;
    subscribe(
      listener: (publication: DevBuildPublication | undefined) => void,
    ): () => void;
  };
  shouldUpdateRemote(
    remote: RemoteUpdateTarget,
    options: RemoteCheckOptions,
  ): Promise<boolean>;
  updateRemotes(
    remotes: RemoteUpdateTarget[],
    options: RemoteCheckOptions,
  ): Promise<{ changed?: boolean }>;
  onUpdating?(remotes: RemoteUpdateTarget[]): void;
  onApplied(remotes: RemoteUpdateTarget[]): void;
  onError(error: unknown): void;
  checkTimeoutMs?: number;
  requestTimeoutMs?: number;
}

function identity(remote: DevBuildRemote) {
  const url = new URL(remote.entry);
  if (['127.0.0.1', '[::1]'].includes(url.hostname)) url.hostname = 'localhost';
  url.hash = '';
  return JSON.stringify([remote.name, url.href]);
}

/** One subscription owner, with coalesced request checks only while unsynchronized. */
export function startDevRemoteUpdates(options: DevRemoteUpdatesOptions) {
  const lifetime = new AbortController();
  const read = createRemoteManifestReader({ waitForDevReady: true });
  const publisher = options.build?.publisher();
  const remotes = options.remotes.filter(remote =>
    /^https?:\/\/.*\.json(?:[?#]|$)/.test(remote.entry),
  );
  const publications = new Map<string, DevBuildPublication>();
  const known = new Set<string>();
  const brokerReady = new Set<string>();
  const statuses = new Map<string, DevBuildStatus>();
  const unavailable = new Set<string>();
  const services = new Set<string>();
  const pendingPublication = () =>
    remotes.some(remote => {
      const key = identity(remote);
      return (
        brokerReady.has(key) &&
        ['waiting', 'updating'].includes(statuses.get(key) || '')
      );
    });
  let local: DevBuildPublication | undefined;
  let sent: string | undefined;
  let isRefreshing = false;
  let ready = true;
  let queue = Promise.resolve();
  let checking: Promise<void> | undefined;
  let closing: Promise<void> | undefined;
  const report = (error: unknown) => {
    if (!lifetime.signal.aborted) options.onError(error);
  };
  const enqueue = (operation: () => Promise<void>) => {
    const result = queue.then(() => {
      if (!lifetime.signal.aborted) return operation();
    });
    const tail = result
      .catch(() => {})
      .finally(() => {
        if (queue !== tail) return;
        isRefreshing = false;
        publish();
      });
    queue = tail;
    return result;
  };
  const waitForUpdates = async () => {
    // Notifications received while waiting extend admission to the latest work.
    let observed: typeof queue;
    do {
      observed = queue;
      await observed;
    } while (observed !== queue);
  };
  const sources = () => {
    const values = new Map<string, DevBuildSource>();
    for (const remote of remotes) {
      const publication = publications.get(identity(remote));
      if (!publication) continue;
      for (const source of [
        {
          name: remote.name,
          entry: remote.entry,
          buildVersion: publication.buildVersion,
          hot: publication.hot,
        },
        ...(publication.sources || []),
      ]) {
        const key = identity(source);
        if (!publisher || key !== identity(publisher)) values.set(key, source);
      }
    }
    return [...values.values()].sort((a, b) =>
      identity(a).localeCompare(identity(b)),
    );
  };
  const publish = () => {
    if (
      !local ||
      !ready ||
      isRefreshing ||
      lifetime.signal.aborted ||
      pendingPublication() ||
      unavailable.size > 0
    )
      return;
    const dependencies = sources();
    const publication = {
      ...local,
      sources: dependencies,
      hot:
        local.hot === true && dependencies.every(source => source.hot === true),
    };
    const fingerprint = JSON.stringify(publication);
    if (sent === fingerprint) return;
    connection.publish(publication);
    sent = fingerprint;
  };
  const apply = async (
    targets: RemoteUpdateTarget[],
    notification?: { remote: DevBuildRemote; publication: DevBuildPublication },
  ) => {
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new Error('Remote manifest check timed out')),
      options.checkTimeoutMs ?? DEV_MANIFEST_WAIT_TIMEOUT,
    );
    timer.unref?.();
    const signal = AbortSignal.any([lifetime.signal, deadline.signal]);
    try {
      const reads = new Map<string, Promise<Record<string, unknown>>>();
      const readOnce = (target: RemoteUpdateTarget) => {
        let pending = reads.get(target.entry);
        if (!pending) {
          pending = read(target, { signal });
          reads.set(target.entry, pending);
        }
        return pending;
      };
      const readDependencies = async (
        target: RemoteUpdateTarget,
        moduleInfo: Record<string, unknown>,
      ) => {
        const visited = new Set([identity(target)]);
        if (publisher) visited.add(identity(publisher));
        const nested: DevBuildSource[] = [];
        let current = [moduleInfo];
        while (current.length) {
          const next: DevBuildRemote[] = [];
          for (const info of current)
            for (const dependency of (info.remotes || []) as any[]) {
              if (
                typeof dependency.federationContainerName !== 'string' ||
                typeof dependency.entry !== 'string' ||
                !/^https?:\/\/.*\.json(?:[?#]|$)/.test(dependency.entry)
              )
                continue;
              const remote = {
                name: dependency.federationContainerName,
                entry: dependency.entry,
              };
              const key = identity(remote);
              if (visited.has(key)) continue;
              visited.add(key);
              next.push(remote);
            }
          current = await Promise.all(
            next.map(async remote => {
              const info = await readOnce(remote);
              const buildInfo = (info.metaData as any)?.buildInfo;
              if (buildInfo?.buildVersion)
                nested.push({
                  ...remote,
                  buildVersion: buildInfo.buildVersion,
                });
              return info;
            }),
          );
        }
        return nested;
      };
      const results = await Promise.allSettled(
        targets.map(async remote => {
          const moduleInfo = await readOnce(remote);
          const notified =
            notification?.remote &&
            identity(notification.remote) === identity(remote)
              ? notification.publication
              : undefined;
          const { buildVersion } =
            (moduleInfo.metaData as any)?.buildInfo || {};
          if (notified && notified.buildVersion !== buildVersion)
            throw new Error(`Remote build was superseded: ${remote.entry}`);
          const publication = notified || {
            buildVersion,
            sources: await readDependencies(remote, moduleInfo),
          };
          const dependencies = (publication.sources || [])
            .filter(
              source =>
                identity(source) !== identity(remote) &&
                (!publisher || identity(source) !== identity(publisher)),
            )
            .map(({ name, entry, buildVersion }) => ({
              name,
              entry,
              buildVersion,
            }))
            .sort((a, b) => identity(a).localeCompare(identity(b)));
          const candidate = { ...remote, moduleInfo, dependencies };
          return {
            candidate,
            publication,
            service: (
              (moduleInfo.exposes || []) as { servicePath?: string }[]
            ).some(expose => typeof expose.servicePath === 'string'),
            changed: await options.shouldUpdateRemote(candidate, { signal }),
          };
        }),
      );
      for (const [index, result] of results.entries()) {
        const key = identity(targets[index]);
        if (
          result.status === 'rejected' &&
          known.has(key) &&
          (deadline.signal.aborted ||
            result.reason instanceof RemoteManifestUnavailableError)
        )
          unavailable.add(key);
      }
      if (unavailable.size > 0 && sent !== undefined) {
        connection.invalidate();
        sent = undefined;
      }
      lifetime.signal.throwIfAborted();
      const changes: RemoteUpdateTarget[] = [];
      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          if (notification) throw result.reason;
          if (!unavailable.has(identity(targets[index]))) report(result.reason);
        } else {
          const key = identity(result.value.candidate);
          known.add(key);
          unavailable.delete(key);
          if (result.value.service) services.add(key);
          else services.delete(key);
          if (result.value.changed) changes.push(result.value.candidate);
        }
      }
      // The manifest deadline bounds reads, not draining existing SSR work.
      clearTimeout(timer);
      if (changes.length) {
        isRefreshing = true;
        options.onUpdating?.(changes);
        ready = false;
        connection.invalidate();
        sent = undefined;
        await options.updateRemotes(changes, {
          signal: lifetime.signal,
        });
        ready = true;
        if (!lifetime.signal.aborted) options.onApplied(changes);
      }
      if (lifetime.signal.aborted) return;
      for (const result of results)
        if (
          result.status === 'fulfilled' &&
          result.value.publication.buildVersion
        )
          publications.set(
            identity(result.value.candidate),
            result.value.publication,
          );
      publish();
      if (unavailable.size > 0)
        throw new DevRemoteUnavailableError('Remote build is not ready');
    } finally {
      clearTimeout(timer);
    }
  };
  // Coalesce only notifications that have not started. A notification received
  // during an update becomes another queue item and keeps admission closed.
  type Notification = {
    remote: DevBuildRemote;
    publication: DevBuildPublication;
  };
  const pending = new Map<
    string,
    { notification: Notification; promise: Promise<void> }
  >();
  const connection = createDevBuildConnection(
    { publisher, remotes },
    {
      onUpdate: notification => {
        isRefreshing = true;
        const key = identity(notification.remote);
        const previous = pending.get(key);
        if (previous) {
          previous.notification = notification;
          return previous.promise;
        }
        const promise = enqueue(async () => {
          const latest = pending.get(key)!.notification;
          pending.delete(key);
          const remote = remotes.find(remote => identity(remote) === key);
          if (remote) await apply([remote], latest);
        }).catch(error => {
          // Failed acknowledgements recover through HTTP on the next request.
          brokerReady.delete(key);
          throw error;
        });
        pending.set(key, { notification, promise });
        return promise;
      },
      onError: report,
      onStatus(remote, status) {
        const key = identity(remote);
        if (status === 'ready') {
          known.add(key);
          brokerReady.add(key);
        }
        statuses.set(key, status);
        if (pendingPublication() && sent !== undefined) {
          connection.invalidate();
          sent = undefined;
        }
        if (
          status === 'waiting' &&
          brokerReady.has(key) &&
          publisher &&
          publications
            .get(key)
            ?.sources?.some(source => identity(source) === identity(publisher))
        ) {
          // An invalidation returned through a dependency cycle. Propagate it
          // first, then use manifests to break the mutual ready dependency.
          brokerReady.delete(key);
          unavailable.add(key);
          const target = remotes.find(remote => identity(remote) === key)!;
          void enqueue(() => apply([target])).catch(report);
        }
        publish();
      },
    },
  );
  const unsubscribe = options.build?.subscribe(publication => {
    local = publication;
    if (!publication) {
      sent = undefined;
      connection.invalidate();
    } else {
      if (!isRefreshing) ready = true;
      publish();
    }
  });
  return {
    check(request?: Request): Promise<void> {
      if (lifetime.signal.aborted)
        return request
          ? Promise.reject(
              new DevRemoteUnavailableError(
                'Development update owner is closed',
              ),
            )
          : Promise.resolve();
      if (!checking) {
        checking = waitForUpdates()
          .then(() => {
            if (!ready)
              throw new DevRemoteUnavailableError('Node SSR update failed');
            return enqueue(async () => {
              const pending = remotes.filter(remote => {
                const key = identity(remote);
                // Cached JS can serve the old generation during compilation.
                // A Service makes live HTTP calls: its producer may already have
                // replaced that generation before the ready event reaches us.
                if (
                  !services.has(key) &&
                  !unavailable.has(key) &&
                  ((brokerReady.has(key) && statuses.get(key) === 'waiting') ||
                    (publications.has(key) && statuses.get(key) === 'updating'))
                )
                  return false;
                return (
                  !connection.isSynchronized(remote) || unavailable.has(key)
                );
              });
              if (pending.length) await apply(pending);
            });
          })
          .then(waitForUpdates)
          .then(() => {
            if (!ready)
              throw new DevRemoteUnavailableError('Node SSR update failed');
          })
          .catch(error => {
            if (lifetime.signal.aborted) return;
            if (error instanceof DevRemoteUnavailableError) throw error;
            report(error);
            throw new DevRemoteUnavailableError(
              error instanceof Error ? error.message : 'Node SSR update failed',
            );
          })
          .finally(() => {
            checking = undefined;
          });
      }
      if (!request) return checking;
      const check = checking;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            finish(
              new DevRemoteUnavailableError('Remote build readiness timed out'),
            ),
          options.requestTimeoutMs ?? DEV_MANIFEST_WAIT_TIMEOUT,
        );
        const finish = (error?: unknown) => {
          clearTimeout(timer);
          request.signal.removeEventListener('abort', abort);
          lifetime.signal.removeEventListener('abort', closed);
          if (error) reject(error);
          else resolve();
        };
        const abort = () => finish(request.signal.reason);
        const closed = () =>
          finish(
            new DevRemoteUnavailableError('Development update owner is closed'),
          );
        request.signal.addEventListener('abort', abort, { once: true });
        lifetime.signal.addEventListener('abort', closed, { once: true });
        if (request.signal.aborted) abort();
        else if (lifetime.signal.aborted) closed();
        check.then(() => finish(), finish);
      });
    },
    close() {
      return (closing ||= (async () => {
        lifetime.abort();
        unsubscribe?.();
        await connection.close();
        await queue;
        pending.clear();
      })());
    },
  };
}
