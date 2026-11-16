import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import { renderDocument } from '@modern-js/render/html';
import { renderStringElement } from '@modern-js/render/html/server';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type React from 'react';
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
import { getSSRConfigByEntry } from '../utils';
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
    const rendered = renderStringElement(finalApp, {
      identifierPrefix: SSR_HYDRATION_ID_PREFIX,
      collect: () => ReactHelmet.renderStatic(),
      onTiming: cost => onTiming(SSRTimings.RENDER_HTML, cost),
    });
    html = rendered.html;
    helmetData = rendered.collected;
    chunkSet.renderLevel = RenderLevel.SERVER_RENDER;
  } catch (e) {
    chunkSet.renderLevel = RenderLevel.CLIENT_RENDER;
    onError(e, SSRErrors.RENDER_HTML);
  }

  // collectors do effect
  await Promise.all(collectors.map(component => component.effect()));

  const { ssrScripts, cssChunk, jsChunk } = chunkSet;

  const replaceHelmet = createReplaceHelemt(helmetData);

  // Helmet uses the first <title> of the whole document, so keep the previous
  // order when it may be in the app html.
  const appHtmlMayHaveFirstTitle =
    html.includes('<title') &&
    !hasTitleTagBefore(htmlTemplate, htmlTemplate.indexOf(HTML_PLACEHOLDER));

  return buildHtml(
    renderDocument(htmlTemplate, {
      app: { placeholder: HTML_PLACEHOLDER, content: html },
      data: [{ placeholder: SSR_DATA_PLACEHOLDER, content: ssrScripts }],
      assets: [
        { placeholder: CHUNK_JS_PLACEHOLDER, content: jsChunk },
        { placeholder: CHUNK_CSS_PLACEHOLDER, content: cssChunk },
      ],
      helmet: replaceHelmet,
      appFirst: appHtmlMayHaveFirstTitle,
    }),
    htmlModifiers,
  );
}
