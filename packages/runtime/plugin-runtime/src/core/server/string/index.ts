import ReactHelmet from 'react-helmet';
import ReactDomServer from 'react-dom/server';
import React from 'react';
import { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import { time } from '@modern-js/runtime-utils/time';
import { run } from '@modern-js/runtime-utils/node';
import { parseHeaders } from '@modern-js/runtime-utils/universal';
import { createReplaceHelemt } from '../helmet';
import { getSSRConfigByEntry, safeReplace } from '../utils';
import {
  CHUNK_CSS_PLACEHOLDER,
  CHUNK_JS_PLACEHOLDER,
  HTML_PLACEHOLDER,
  SSR_DATA_PLACEHOLDER,
} from '../constants';
import { BuildHtmlCb, RenderLevel, RenderString, buildHtml } from '../shared';
import {
  SSRErrors,
  SSRTimings,
  Tracer,
  createOnError,
  createOnTiming,
} from '../tracer';
import { SSRDataCollector } from './ssrData';
import { LoadableCollector } from './loadable';
import { Collector, ChunkSet } from './types';
import { StyledCollector } from './styledComponent';
import { prefetch } from './prefetch';

export const renderString: RenderString = async (
  request,
  serverRoot,
  options,
) => {
  const headersData = parseHeaders(request);

  return run(headersData, async () => {
    const { resource, runtimeContext, config, onError, onTiming } = options;

    const tracer: Tracer = {
      onError: createOnError(onError),
      onTiming: createOnTiming(onTiming),
    };

    const routerContext = runtimeContext.routerContext as StaticHandlerContext;

    const { htmlTemplate, entryName } = resource;

    const chunkSet: ChunkSet = {
      renderLevel: RenderLevel.SERVER_RENDER,
      ssrScripts: '',
      jsChunk: '',
      cssChunk: '',
    };

    let prefetchData = {};

    try {
      prefetchData = await prefetch(serverRoot, request, options, tracer);
      chunkSet.renderLevel = RenderLevel.SERVER_PREFETCH;
    } catch (e) {
      chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    }

    const ssrConfig = getSSRConfigByEntry(
      entryName,
      config.ssr,
      config.ssrByEntries,
    );

    const collectors = [
      new StyledCollector(chunkSet),
      new LoadableCollector({
        template: htmlTemplate,
        entryName,
        chunkSet,
        config,
      }),
      new SSRDataCollector({
        request,
        prefetchData,
        ssrConfig,
        chunkSet,
        routerContext,
      }),
    ];

    const App = React.createElement(serverRoot, {
      context: Object.assign(runtimeContext, { ssr: true }),
    });

    const html = await generateHtml(
      App,
      htmlTemplate,
      chunkSet,
      collectors,
      tracer,
    );

    return html;
  });
};

async function generateHtml(
  App: React.ReactElement,
  htmlTemplate: string,
  chunkSet: ChunkSet,
  collectors: Collector[],
  { onError, onTiming }: Tracer,
): Promise<string> {
  const end = time();
  let html = '';
  let helmetData;

  try {
    const finalApp = collectors.reduce(
      (pre, creator) => creator.collect?.(pre) || pre,
      App,
    );

    // react render to string
    html = ReactDomServer.renderToString(finalApp);

    helmetData = ReactHelmet.renderStatic();
    chunkSet.renderLevel = RenderLevel.SERVER_RENDER;

    // collectors do effect
    await Promise.all(collectors.map(component => component.effect()));

    const cost = end();

    onTiming(SSRTimings.RENDER_HTML, cost);
  } catch (e) {
    chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    onError(SSRErrors.RENDER_HTML, e);
  }

  const { ssrScripts, cssChunk, jsChunk } = chunkSet;

  const finalHtml = await buildHtml(htmlTemplate, [
    createReplaceHtml(html),
    createReplaceChunkJs(jsChunk),
    createReplaceChunkCss(cssChunk),
    createReplaceSSRDataScript(ssrScripts),
    createReplaceHelemt(helmetData),
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
