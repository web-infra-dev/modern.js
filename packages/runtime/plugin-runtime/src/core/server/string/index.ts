import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type React from 'react';
import ReactDomServer from 'react-dom/server';
import ReactHelmet from 'react-helmet';
import { RenderLevel } from '../../constants';
import { getGlobalInternalRuntimeContext } from '../../context';
import { wrapRuntimeContextProvider } from '../../react/wrapper';
import {
  CHUNK_CSS_PLACEHOLDER,
  CHUNK_JS_PLACEHOLDER,
  HTML_PLACEHOLDER,
  SSR_DATA_PLACEHOLDER,
} from '../constants';
import { createReplaceHelemt, hasTitleTagBefore } from '../helmet';
import { type BuildHtmlCb, type RenderString, buildHtml } from '../shared';
import { SSRErrors, SSRTimings, type Tracer } from '../tracer';
import { getSSRConfigByEntry, safeReplace } from '../utils';
import { LoadableCollector } from './loadable';
import { SSRDataCollector } from './ssrData';
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

  const collectors: Collector[] = [
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
      runtimeContext,
      request,
      ssrConfig,
      ssrContext: runtimeContext.ssrContext!,
      chunkSet,
      routerContext,
      nonce: config.nonce,
      useJsonScript: config.useJsonScript,
    }),
  ];

  const internalRuntimeContext = getGlobalInternalRuntimeContext();
  const hooks = internalRuntimeContext.hooks;

  const extraCollectors = hooks.extendStringSSRCollectors.call({
    chunkSet,
  });

  for (const c of extraCollectors) {
    if (c) collectors.unshift(c);
  }

  const rootElement = wrapRuntimeContextProvider(
    serverRoot,
    Object.assign(runtimeContext, { ssr: true }),
  );

  const html = await generateHtml(
    rootElement,
    htmlTemplate,
    chunkSet,
    collectors,
    runtimeContext.ssrContext?.htmlModifiers || [],
    tracer,
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
): Promise<string> {
  let html = '';
  let helmetData;

  const finalApp = collectors.reduce(
    (pre, creator) => creator.collect?.(pre) || pre,
    App,
  );
  try {
    const end = time();
    // react render to string
    html = ReactDomServer.renderToString(finalApp, {
      identifierPrefix: SSR_HYDRATION_ID_PREFIX,
    });
    chunkSet.renderLevel = RenderLevel.SERVER_RENDER;
    helmetData = ReactHelmet.renderStatic();

    const cost = end();
    onTiming(SSRTimings.RENDER_HTML, cost);
  } catch (e) {
    chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    onError(e, SSRErrors.RENDER_HTML);
  }

  // collectors do effect
  await Promise.all(collectors.map(component => component.effect()));

  const { ssrScripts, cssChunk, jsChunk } = chunkSet;

  const replaceChunks = [
    createReplaceChunkJs(jsChunk),
    createReplaceChunkCss(cssChunk),
  ];
  const replaceHelmet = createReplaceHelemt(helmetData);

  // Helmet uses the first <title> of the whole document, so keep the previous
  // order when it may be in the app html.
  const appHtmlMayHaveFirstTitle =
    html.includes('<title') &&
    !hasTitleTagBefore(htmlTemplate, htmlTemplate.indexOf(HTML_PLACEHOLDER));

  const finalHtml = await buildHtml(htmlTemplate, [
    ...(appHtmlMayHaveFirstTitle
      ? [
          createReplaceHtml(html),
          ...replaceChunks,
          createReplaceSSRDataScript(ssrScripts),
          replaceHelmet,
        ]
      : [
          // Insert the large SSR data and app html after the template edits, so
          // they aren't scanned and copied by each edit. Mark their positions
          // first, so content added by the edits can't take the placeholders.
          (template: string) =>
            safeReplace(
              safeReplace(template, HTML_PLACEHOLDER, HTML_MARKER),
              SSR_DATA_PLACEHOLDER,
              SSR_DATA_MARKER,
            ),
          ...replaceChunks,
          replaceHelmet,
          (template: string) =>
            safeReplace(template, SSR_DATA_MARKER, ssrScripts),
          (template: string) => safeReplace(template, HTML_MARKER, html),
        ]),
    ...htmlModifiers,
  ]);

  return finalHtml;
}

// Unique per process, so neither the template edits nor the app can produce them.
const markerId = Math.random().toString(36).slice(2);
const HTML_MARKER = `<!--modern-html-${markerId}-->`;
const SSR_DATA_MARKER = `<!--modern-ssr-data-${markerId}-->`;

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
