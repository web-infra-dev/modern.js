import {
  createDevBuildConnection,
  type DevBuildPublication,
  type DevBuildRemote,
  type DevBuildSource,
} from '@module-federation/enhanced/rspack';
import {
  createRemoteManifestReader,
  type RemoteCheckOptions,
  type RemoteUpdateTarget,
} from './remoteUpdate';

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
  onApplied(remotes: RemoteUpdateTarget[], options: { reload: boolean }): void;
  onError(error: unknown): void;
  checkTimeoutMs?: number;
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
  const read = createRemoteManifestReader();
  const publisher = options.build?.publisher();
  const remotes = options.remotes.filter(remote =>
    /^https?:\/\/.*\.json(?:[?#]|$)/.test(remote.entry),
  );
  const publications = new Map<string, DevBuildPublication>();
  let local: DevBuildPublication | undefined;
  let sent: string | undefined;
  let applying = false;
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
    queue = result.catch(() => {});
    return result;
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
          ssrBuildVersion: publication.ssrBuildVersion,
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
    if (!local || !ready || applying || lifetime.signal.aborted) return;
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
      options.checkTimeoutMs ?? 5000,
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
                  ssrBuildVersion: (info.metaData as any)?.ssrRemoteEntry
                    ?.buildVersion,
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
          const ssrBuildVersion = (moduleInfo.metaData as any)?.ssrRemoteEntry
            ?.buildVersion;
          if (
            notified &&
            (notified.buildVersion !== buildVersion ||
              notified.ssrBuildVersion !== ssrBuildVersion)
          )
            throw new Error(`Remote build was superseded: ${remote.entry}`);
          const publication = notified || {
            buildVersion,
            ssrBuildVersion,
            sources: await readDependencies(remote, moduleInfo),
          };
          const dependencies = (publication.sources || [])
            .filter(
              source =>
                identity(source) !== identity(remote) &&
                (!publisher || identity(source) !== identity(publisher)),
            )
            .map(({ name, entry, buildVersion, ssrBuildVersion }) => ({
              name,
              entry,
              buildVersion,
              ssrBuildVersion,
            }))
            .sort((a, b) => identity(a).localeCompare(identity(b)));
          const candidate = { ...remote, moduleInfo, dependencies };
          return {
            candidate,
            publication,
            changed: await options.shouldUpdateRemote(candidate, { signal }),
          };
        }),
      );
      signal.throwIfAborted();
      const changes: RemoteUpdateTarget[] = [];
      for (const result of results) {
        if (result.status === 'rejected') {
          if (notification) throw result.reason;
          report(result.reason);
        } else if (result.value.changed) changes.push(result.value.candidate);
      }
      // The manifest deadline bounds reads, not draining existing SSR work.
      clearTimeout(timer);
      if (changes.length) {
        applying = true;
        ready = false;
        connection.invalidate();
        sent = undefined;
        const result = await options.updateRemotes(changes, {
          signal: lifetime.signal,
        });
        ready = true;
        applying = false;
        if (!lifetime.signal.aborted && result.changed !== false)
          options.onApplied(changes, {
            reload: notification?.publication.hot !== true,
          });
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
    } finally {
      applying = false;
      clearTimeout(timer);
    }
  };
  const connection = createDevBuildConnection(
    { publisher, remotes },
    {
      onUpdate: notification =>
        enqueue(async () => {
          const remote = remotes.find(
            remote => identity(remote) === identity(notification.remote),
          );
          if (remote) await apply([remote], notification);
        }),
      onError: report,
    },
  );
  const unsubscribe = options.build?.subscribe(publication => {
    local = publication;
    if (!publication) {
      sent = undefined;
      connection.invalidate();
    } else {
      if (!applying) ready = true;
      publish();
    }
  });
  return {
    check() {
      if (lifetime.signal.aborted) return Promise.resolve();
      if (checking) return checking;
      checking = enqueue(async () => {
        const pending = remotes.filter(
          remote => !connection.isSynchronized(remote),
        );
        if (pending.length) await apply(pending);
      })
        .catch(report)
        .finally(() => {
          checking = undefined;
        });
      return checking;
    },
    close() {
      return (closing ||= (async () => {
        lifetime.abort();
        unsubscribe?.();
        await connection.close();
        await queue;
      })());
    },
  };
}
