import {
  createDevBuildConnection,
  type DevBuildPublication,
  type DevBuildRemote,
  type DevBuildResult,
  type DevBuildSource,
} from '@module-federation/enhanced/rspack';
import { logger } from '@modern-js/utils';
import {
  createRemoteManifestReader,
  type RemoteCheckOptions,
  type RemoteUpdateTarget,
} from './remoteUpdate';

export interface DevRemoteUpdatesOptions {
  consumer?: string;
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
  ): Promise<{
    changed?: boolean;
    operationId?: string;
    timingsMs?: Record<string, number>;
  }>;
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

function diagnose(action: () => void) {
  try {
    action();
  } catch {
    // Diagnostics must not change publication or update results.
  }
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
  const diagnosticsUrls = new Set<string>();
  let local: DevBuildPublication | undefined;
  let sent: string | undefined;
  let announcedBuildVersion: string | undefined;
  let applying = false;
  let ready = true;
  let queue = Promise.resolve();
  let checking: Promise<void> | undefined;
  let closing: Promise<void> | undefined;
  const report = (error: unknown) => {
    if (!lifetime.signal.aborted) diagnose(() => options.onError(error));
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
    if (publisher && announcedBuildVersion !== local.buildVersion) {
      announcedBuildVersion = local.buildVersion;
      diagnose(() => logger.info(`[MF] ${publisher.name} ready`));
    }
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
    const trigger = notification ? 'notification' : 'manifest';
    const versions = new Map<string, string>();
    const failures = new Set<string>();
    let failureTargets = targets;
    let stage = 'check';
    const result = (remote: DevBuildRemote, value: DevBuildResult) => {
      if (!lifetime.signal.aborted)
        diagnose(() =>
          connection.reportResult(
            {
              name: remote.name,
              entry: remote.entry,
              ...(remote.brokerUrl ? { brokerUrl: remote.brokerUrl } : {}),
            },
            value,
          ),
        );
    };
    const fail = (remote: DevBuildRemote, error: unknown) => {
      diagnose(() => {
        const key = identity(remote);
        if (failures.has(key)) return;
        failures.add(key);
        const detail = error as Partial<DevBuildResult> & {
          failedStage?: string;
        };
        result(remote, {
          outcome: 'failed',
          trigger,
          buildVersion: versions.get(key),
          operationId: detail?.operationId,
          stage: detail?.failedStage || detail?.stage || stage,
          timingsMs: detail?.timingsMs,
          error:
            error instanceof Error
              ? error.stack || error.message
              : String(error),
        });
      });
    };
    if (notification)
      versions.set(
        identity(notification.remote),
        notification.publication.buildVersion,
      );
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
          if (!notified && typeof buildVersion === 'string')
            versions.set(identity(remote), buildVersion);
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
            changed: await options.shouldUpdateRemote(candidate, { signal }),
          };
        }),
      );
      signal.throwIfAborted();
      const changes: RemoteUpdateTarget[] = [];
      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          fail(targets[index], result.reason);
          if (notification) throw result.reason;
          report(result.reason);
        } else if (result.value.changed) changes.push(result.value.candidate);
      }
      // The manifest deadline bounds reads, not draining existing SSR work.
      clearTimeout(timer);
      failureTargets = changes;
      stage = 'apply';
      if (changes.length) {
        applying = true;
        ready = false;
        connection.invalidate();
        sent = undefined;
        const applied = await options.updateRemotes(changes, {
          signal: lifetime.signal,
        });
        failureTargets = [];
        ready = true;
        applying = false;
        if (!lifetime.signal.aborted && applied.changed !== false) {
          for (const remote of changes)
            result(remote, {
              outcome: 'applied',
              trigger,
              buildVersion: versions.get(identity(remote)),
              operationId: applied.operationId,
              timingsMs: applied.timingsMs,
            });
          options.onApplied(changes, {
            reload: notification?.publication.hot !== true,
          });
          diagnose(() =>
            logger.info(
              `[MF] ${changes.map(remote => remote.name).join(', ')} updated`,
            ),
          );
        }
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
    } catch (error) {
      for (const remote of failureTargets) fail(remote, error);
      throw error;
    } finally {
      applying = false;
      clearTimeout(timer);
    }
  };
  const connection = createDevBuildConnection(
    { publisher, remotes, consumer: options.consumer },
    {
      onUpdate: notification =>
        enqueue(async () => {
          const remote = remotes.find(
            remote => identity(remote) === identity(notification.remote),
          );
          if (remote) await apply([remote], notification);
        }),
      onError: report,
      onDiagnostics: ({ url }) => {
        if (diagnosticsUrls.has(url)) return;
        diagnosticsUrls.add(url);
        diagnose(() => logger.info(`[MF] logs: ${url}`));
      },
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
