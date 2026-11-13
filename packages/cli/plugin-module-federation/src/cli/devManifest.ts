import type { Rspack } from '@rsbuild/core';
import {
  setCompilationBuildVersion,
  type DevBuildPublication,
} from '@module-federation/enhanced/rspack';

/** Compile and publish both targets with one application build identity. */
export function createDevManifestPublication() {
  type State = { compilation?: object };
  const states: State[] = [];
  const compilations = new WeakMap<
    object,
    { state: State; buildVersion: string }
  >();
  let version = Date.now();
  let buildVersion = String(version);
  let coordinating = false;
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
  const isCurrent = (stats: any) => {
    const children = stats?.stats || [stats];
    return (
      children.length === states.length &&
      children.every((child: any) => {
        const captured =
          child?.compilation && compilations.get(child.compilation);
        return (
          captured &&
          captured.buildVersion === buildVersion &&
          captured.state.compilation === child.compilation
        );
      })
    );
  };
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
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const origin of compilers) {
        const state: State = {};
        states.push(state);
        origin.hooks.thisCompilation.tap(
          { name: 'ModernFederationManifest', stage: -Infinity },
          compilation => {
            setCompilationBuildVersion(compilation, buildVersion);
            state.compilation = compilation;
            compilations.set(compilation, { state, buildVersion });
          },
        );
        origin.hooks.invalid.tap(
          { name: 'ModernFederationManifest', stage: -Infinity },
          () => {
            if (coordinating) return;
            // Invalidations before either target starts belong to the same round.
            // A save after compilation starts supersedes that whole round.
            if (
              states.some(
                item =>
                  item.compilation &&
                  compilations.get(item.compilation)?.buildVersion ===
                    buildVersion,
              )
            ) {
              version = Math.max(Date.now(), version + 1);
              buildVersion = String(version);
            }
            published = undefined;
            readyPublication = undefined;
            for (const listener of listeners) listener(undefined);
            invalidate();
            coordinating = true;
            try {
              for (const peer of compilers) {
                if (peer !== origin) peer.watching?.invalidate();
              }
            } finally {
              coordinating = false;
            }
          },
        );
      }
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
  };
}
