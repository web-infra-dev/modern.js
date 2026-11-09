import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import type { PreloadItem, ResourceStagesManifest } from './manifest';
import type { ChunkId, StagePayload } from './types';

type CrossOrigin = boolean | 'anonymous' | 'use-credentials' | undefined;

/**
 * Same rule as the bundler runtime: `use-credentials` always applies, other
 * values only to files from another origin. A preload whose `crossorigin`
 * differs from the later `<script>` is not reused.
 */
export const getPreloadCrossOrigin = (
  href: string,
  crossorigin: CrossOrigin,
) => {
  if (!crossorigin) {
    return undefined;
  }
  const value = crossorigin === true ? 'anonymous' : crossorigin;
  if (value === 'use-credentials') {
    return value;
  }
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(href) ? value : undefined;
};

const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export const renderPreloads = (
  items: PreloadItem[],
  options: { nonce?: string; crossorigin?: CrossOrigin; exclude?: Set<string> },
) => {
  const { nonce, crossorigin, exclude = new Set() } = options;
  return items
    .filter(item => {
      if (exclude.has(item.h)) {
        return false;
      }
      exclude.add(item.h);
      return true;
    })
    .map(item => {
      const cross = getPreloadCrossOrigin(item.h, crossorigin);
      return `<link rel="preload" as="${item.a}" href="${escapeAttribute(item.h)}"${
        cross ? ` crossorigin="${cross}"` : ''
      }${nonce ? ` nonce="${escapeAttribute(nonce)}"` : ''}${
        item.l ? ' fetchpriority="low"' : ''
      } />`;
    })
    .join('');
};

/** JSON that is safe inside an inline `<script>`. */
const serialize = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export const renderPayloadScript = (payload: StagePayload, nonce?: string) =>
  `<script${nonce ? ` nonce="${escapeAttribute(nonce)}"` : ''}>(self.${RESOURCE_STAGES}=self.${RESOURCE_STAGES}||[]).push(${serialize(payload)})</script>`;

const mergeLists = (
  target: Record<string, ChunkId[]>,
  lists?: Record<string, ChunkId[]>,
) => {
  for (const [stage, chunkIds] of Object.entries(lists ?? {})) {
    target[stage] = [...(target[stage] ?? []), ...chunkIds];
  }
};

/**
 * HTML for the matched routes: preloads of their `critical` files and the
 * lists of the later stages. The entry level part is already in the template.
 */
export const renderRouteStages = (
  manifest: ResourceStagesManifest | undefined,
  routeIds: string[],
  options: {
    mode: 'string' | 'stream';
    template: string;
    loadedUrls: Set<string>;
    nonce?: string;
    crossorigin?: CrossOrigin;
  },
) => {
  if (!manifest || !routeIds.length) {
    return '';
  }
  const useRouteRule = manifest.routeRule && options.mode === 'stream';
  const preloads: PreloadItem[] = [];
  const lists: Record<string, ChunkId[]> = {};
  const cssFiles: Record<string, string[]> = {};
  const externals: string[] = [];
  for (const routeId of routeIds) {
    const route = manifest.routes[routeId];
    if (!route) {
      continue;
    }
    if (useRouteRule && route.rc) {
      preloads.push(...route.rc);
    }
    if (route.c) {
      preloads.push(...route.c);
    }
    const external = useRouteRule ? route.ur : route.u;
    if (external) {
      externals.push(external);
      continue;
    }
    mergeLists(lists, route.s);
    if (useRouteRule) {
      mergeLists(lists, route.rs);
    }
    Object.assign(cssFiles, route.k);
  }

  let html = renderPreloads(preloads, {
    nonce: options.nonce,
    crossorigin: options.crossorigin,
    exclude: options.loadedUrls,
  });
  const payloads: StagePayload[] = externals.map(u => ({ u }));
  if (Object.keys(lists).length) {
    payloads.push({
      s: lists,
      ...(Object.keys(cssFiles).length ? { k: cssFiles } : {}),
    });
  }
  for (const payload of payloads) {
    html += renderPayloadScript(payload, options.nonce);
  }
  return html;
};
