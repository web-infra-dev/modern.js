import type { OnError, OnTiming } from '@modern-js/app-tools';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import { time } from '@modern-js/runtime-utils/time';
import { parseHeaders } from '@modern-js/runtime-utils/universal/request';
import React from 'react';
import ReactDomServer from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { RenderLevel } from '../../constants';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import {
  CHUNK_CSS_PLACEHOLDER,
  CHUNK_JS_PLACEHOLDER,
  HTML_PLACEHOLDER,
  SSR_DATA_PLACEHOLDER,
} from '../constants';
import { createReplaceHelemt } from '../helmet';
import { type BuildHtmlCb, type RenderString, buildHtml } from '../shared';
import { SSRErrors, SSRTimings, type Tracer } from '../tracer';
import { getSSRConfigByEntry, safeReplace } from '../utils';
import { LoadableCollector } from './loadable';
import { prefetch } from './prefetch';
import { SSRDataCollector } from './ssrData';
import { StyledCollector } from './styledComponent';
import type { ChunkSet, Collector } from './types';

export const renderString: RenderString = async (
  request,
  serverRoot,
  options,
) => {
  const { resource, runtimeContext, config, onError, onTiming } = options;

  const tracer: Tracer = { onError, onTiming };

  const routerContext = runtimeContext.routerContext as StaticHandlerContext;

  const { htmlTemplate, entryName, loadableStats, routeManifest } = resource;

  const ssrConfig = getSSRConfigByEntry(
    entryName,
    config.ssr,
    config.ssrByEntries,
  );

  const chunkSet: ChunkSet = {
    renderLevel: RenderLevel.CLIENT_RENDER,
    ssrScripts: '',
    jsChunk: '',
    cssChunk: '',
  };

  let prefetchData = {};

  try {
    prefetchData = await prefetch(
      serverRoot,
      request,
      options,
      ssrConfig,
      tracer,
    );
    chunkSet.renderLevel = RenderLevel.SERVER_PREFETCH;
  } catch (e) {
    chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    tracer.onError(e, SSRErrors.PRERENDER);
  }

  const collectors = [
    new StyledCollector(chunkSet),
    new LoadableCollector({
      stats: loadableStats,
      nonce: config.nonce,
      routeManifest,
      template: htmlTemplate,
      entryName,
      chunkSet,
      config,
    }),
    new SSRDataCollector({
      request,
      prefetchData,
      ssrConfig,
      ssrContext: runtimeContext.ssrContext!,
      chunkSet,
      routerContext,
      nonce: config.nonce,
      useJsonScript: config.useJsonScript,
    }),
  ];

  const rootElement = wrapRuntimeContextProvider(
    serverRoot,
    Object.assign(runtimeContext, { ssr: true }),
  );

  // Create request-level Helmet context for react-helmet-async
  const helmetContext = {};

  const html = await generateHtml(
    React.createElement(
      HelmetProvider,
      { context: helmetContext },
      rootElement,
    ),
    htmlTemplate,
    chunkSet,
    collectors,
    runtimeContext.ssrContext?.htmlModifiers || [],
    tracer,
    helmetContext,
  );

  return html;
};

async function generateHtml(
  App: React.ReactElement,
  htmlTemplate: string,
  chunkSet: ChunkSet,
  collectors: Collector[],
  htmlModifiers: BuildHtmlCb[],
  { onError, onTiming }: Tracer,
  helmetContext: Record<string, unknown>,
): Promise<string> {
  let html = '';
  let helmetServerState;

  const finalApp = collectors.reduce(
    (pre, creator) => creator.collect?.(pre) || pre,
    App,
  );
  try {
    const end = time();
    // react render to string
    if (chunkSet.renderLevel >= RenderLevel.SERVER_PREFETCH) {
      html = ReactDomServer.renderToString(finalApp);
      chunkSet.renderLevel = RenderLevel.SERVER_RENDER;
    }
    // Get helmet data from request-level context
    helmetServerState = (helmetContext as { helmet?: unknown }).helmet;

    const cost = end();
    onTiming(SSRTimings.RENDER_HTML, cost);
  } catch (e) {
    chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    onError(e, SSRErrors.RENDER_HTML);
  }

  // collectors do effect
  await Promise.all(collectors.map(component => component.effect()));

  const { ssrScripts, cssChunk, jsChunk } = chunkSet;

  const finalHtml = await buildHtml(htmlTemplate, [
    createReplaceHtml(html),
    createReplaceChunkJs(jsChunk),
    createReplaceChunkCss(cssChunk),
    createReplaceSSRDataScript(ssrScripts),
    createReplaceHelemt(
      helmetServerState as Parameters<typeof createReplaceHelemt>[0],
    ),
    ...htmlModifiers,
  ]);

  return finalHtml;
}

function createReplaceHtml(html: string): BuildHtmlCb {
  return (template: string) => safeReplace(template, HTML_PLACEHOLDER, html);
}

function createReplaceSSRDataScript(data: string): BuildHtmlCb {
  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, data);
}

function createReplaceChunkJs(js: string): BuildHtmlCb {
  return (template: string) => safeReplace(template, CHUNK_JS_PLACEHOLDER, js);
}

function createReplaceChunkCss(css: string): BuildHtmlCb {
  return (template: string) =>
    safeReplace(template, CHUNK_CSS_PLACEHOLDER, css);
}
