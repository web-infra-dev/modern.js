import { randomUUID } from 'node:crypto';
import type { Rspack } from '@rsbuild/core';
import type { StatsAssetResource } from '@module-federation/rsbuild-plugin/utils';

/** One identity for a coherent browser/Node build, chosen before either compiles. */
export function createDevBuildVersion() {
  let version = randomUUID();
  let published: string | undefined;
  let propagating = false;
  const compilations = new WeakMap<object, string>();
  const publications = new WeakMap<object, string>();
  const isCurrent = (stats: any) => {
    const children = stats?.stats || [stats];
    return (
      children.length > 0 &&
      children.every(
        (child: any) =>
          child?.compilation && compilations.get(child.compilation) === version,
      )
    );
  };
  return {
    get current() {
      return version;
    },
    get ready() {
      return published === version;
    },
    isReadyFor(stats: unknown) {
      return (
        !!stats &&
        typeof stats === 'object' &&
        published === version &&
        publications.get(stats) === version &&
        isCurrent(stats)
      );
    },
    attach(
      compiler: Rspack.Compiler | Rspack.MultiCompiler,
      invalidate: () => void,
    ) {
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const origin of compilers) {
        origin.hooks.thisCompilation.tap(
          'ModernFederationBuildVersion',
          compilation => {
            compilations.set(compilation, version);
          },
        );
        origin.hooks.invalid.tap(
          { name: 'ModernFederationBuildVersion', stage: -Infinity },
          () => {
            if (propagating) return;
            version = randomUUID();
            published = undefined;
            invalidate();
            // A loader-only or CSS-only edit must also change the peer runtime ID.
            // Invalidate synchronously so both watchRun hooks see the same version.
            propagating = true;
            try {
              for (const other of compilers) {
                if (other !== origin) other.watching?.invalidate();
              }
            } finally {
              propagating = false;
            }
          },
        );
      }
    },
    publish(resources: StatsAssetResource[], stats: object) {
      // A save during compilation or private-plugin preparation supersedes that
      // generation. Never advertise a mixture of old and new compiler outputs.
      if (
        !isCurrent(stats) ||
        resources.some(
          resource =>
            !resource.manifest ||
            !resource.stats ||
            resource.manifest.data.metaData.buildInfo.buildVersion !==
              version ||
            resource.stats.data.metaData.buildInfo.buildVersion !== version,
        )
      )
        return false;
      published = version;
      publications.set(stats, version);
      return true;
    },
  };
}
