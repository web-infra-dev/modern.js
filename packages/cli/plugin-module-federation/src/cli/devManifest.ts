import type { Rspack } from '@rsbuild/core';
import {
  createBuildVersionCoordinator,
  type DevBuildPublication,
} from '@module-federation/enhanced/rspack';

/** Compile and publish both targets with one application build identity. */
export function createDevManifestPublication() {
  let builds: ReturnType<typeof createBuildVersionCoordinator> | undefined;
  let published: object | undefined;
  let readyPublication: DevBuildPublication | undefined;
  let ssrReady = true;
  const listeners = new Set<
    (publication: DevBuildPublication | undefined) => void
  >();
  const notify = () => {
    for (const listener of listeners)
      listener(ssrReady ? readyPublication : undefined);
  };
  const isCurrent = (stats: unknown) => builds?.isCurrent(stats) ?? false;
  return {
    get ready() {
      return !!published && isCurrent(published);
    },
    isReadyFor(stats: unknown) {
      return !!stats && published === stats && isCurrent(stats);
    },
    get ssrReady() {
      return ssrReady;
    },
    setSSRReady(ready: boolean) {
      ssrReady = ready;
      notify();
    },
    attach(
      compiler: Rspack.Compiler | Rspack.MultiCompiler,
      invalidate: () => void,
    ) {
      builds = createBuildVersionCoordinator({
        onInvalidate() {
          published = undefined;
          readyPublication = undefined;
          for (const listener of listeners) listener(undefined);
          invalidate();
        },
      });
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const origin of compilers) builds.apply(origin);
    },
    publish(stats: object) {
      // A save during compilation or private-plugin preparation supersedes that
      // output, even if the compiler finishes successfully afterwards.
      if (!isCurrent(stats)) return false;
      published = stats;
      return true;
    },
    /** Called after manifest, Service plugins and SSR resources are all ready. */
    notifyReady(stats: object, publication: DevBuildPublication) {
      if (published !== stats || !isCurrent(stats)) return false;
      readyPublication = publication;
      notify();
      return true;
    },
    subscribe(
      listener: (publication: DevBuildPublication | undefined) => void,
    ) {
      listeners.add(listener);
      listener(ssrReady ? readyPublication : undefined);
      return () => {
        listeners.delete(listener);
      };
    },
    wait(signal: AbortSignal): Promise<void> {
      if (signal.aborted) return Promise.reject(signal.reason);
      if (ssrReady && readyPublication) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const cleanup = () => {
          listeners.delete(listener);
          signal.removeEventListener('abort', abort);
        };
        const listener = (publication: DevBuildPublication | undefined) => {
          if (!publication) return;
          cleanup();
          resolve();
        };
        const abort = () => {
          cleanup();
          reject(signal.reason);
        };
        listeners.add(listener);
        signal.addEventListener('abort', abort, { once: true });
      });
    },
  };
}
