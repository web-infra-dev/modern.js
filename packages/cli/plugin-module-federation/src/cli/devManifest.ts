import type { Rspack } from '@rsbuild/core';
import { createBuildVersionCoordinator } from '@module-federation/enhanced/rspack';
import { debugMFSSR } from '../server/ssrLogger';
import { isWebTarget } from './utils';

const HOT_UPDATE_ASSET_RE = /\.hot-update\.(?:json|m?js|css)(?:\.map)?$/i;
const MAX_HOT_UPDATE_GENERATIONS = 16;

function hotUpdateContentType(filename: string) {
  if (filename.endsWith('.json') || filename.endsWith('.map'))
    return 'application/json; charset=utf-8';
  if (filename.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'text/javascript; charset=utf-8';
}

interface HotUpdateEntry {
  content: Buffer;
  contentType: string;
  prefix: string;
}

/**
 * Retain recent browser hot-update chunks across rapid multi-compiler rebuilds
 * so cross-origin MF remotes do not fail with HTML fallbacks if Rsbuild's
 * memory-filesystem cleanup evicts an in-flight generation while queued.
 */
export function createDevHotUpdateCache(
  maxGenerations = MAX_HOT_UPDATE_GENERATIONS,
) {
  const generations = new Map<string, Map<string, HotUpdateEntry>>();
  let order: string[] = [];

  return {
    attach(compiler: Rspack.Compiler | Rspack.MultiCompiler) {
      const compilers =
        'compilers' in compiler ? compiler.compilers : [compiler];
      for (const child of compilers) {
        if (!isWebTarget(child.options?.target)) continue;
        child.hooks.afterEmit.tap('ModernMFHotUpdateCache', compilation => {
          if (compilation.errors?.length) return;
          const hash = compilation.hash;
          if (!hash) return;
          const configured = child.options.output?.publicPath;
          const publicPath =
            typeof configured === 'string' && configured !== 'auto'
              ? configured
              : '/';
          const prefix = new URL(
            publicPath || '/',
            'http://modern.invalid',
          ).pathname.replace(/\/?$/, '/');
          const entries = new Map<string, HotUpdateEntry>();
          for (const asset of compilation.getAssets()) {
            const name = asset.name.split('?')[0].replace(/^\/+/, '');
            if (!HOT_UPDATE_ASSET_RE.test(name)) continue;
            const raw = asset.source.source();
            const content = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
            entries.set(name, {
              content,
              contentType: hotUpdateContentType(name),
              prefix,
            });
          }
          if (!entries.size) return;
          generations.set(hash, entries);
          order = order.filter(item => item !== hash);
          order.push(hash);
          while (order.length > maxGenerations) {
            const evicted = order.shift();
            if (evicted) generations.delete(evicted);
          }
        });
      }
    },
    get(pathname: string) {
      if (!HOT_UPDATE_ASSET_RE.test(pathname)) return undefined;
      for (let i = order.length - 1; i >= 0; i--) {
        const entries = generations.get(order[i]);
        if (!entries) continue;
        for (const [name, entry] of entries) {
          const expected = `${entry.prefix}${name}`;
          if (pathname !== expected && pathname !== `/${name}`) continue;
          return { content: entry.content, contentType: entry.contentType };
        }
      }
      return undefined;
    },
  };
}

interface DevBuildPublication {
  buildVersion: string;
}

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
      if (!isCurrent(stats)) {
        debugMFSSR('manifest-superseded', { stage: 'publish' });
        return false;
      }
      published = stats;
      return true;
    },
    /** Called after manifest, Service plugins and SSR resources are all ready. */
    notifyReady(stats: object, publication: DevBuildPublication) {
      if (published !== stats || !isCurrent(stats)) {
        debugMFSSR('manifest-superseded', {
          stage: 'notify-ready',
          buildVersion: publication.buildVersion,
        });
        return false;
      }
      readyPublication = publication;
      debugMFSSR('manifest-ready', {
        buildVersion: publication.buildVersion,
        ssrReady,
      });
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
