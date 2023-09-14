import React from 'react';
import { serializeJson } from '@modern-js/runtime-utils/node';
import ReactHelmet, { HelmetData } from 'react-helmet';
// Todo: This import will introduce router code, like remix, even if router config is false
import { time } from '@modern-js/runtime-utils/time';
import { serializeErrors } from '../../../router/runtime/utils';
import helmetReplace from '../helmet';
import {
  RenderLevel,
  RuntimeContext,
  ModernSSRReactComponent,
  SSRPluginConfig,
  SSRServerContext,
} from '../types';
import prefetch from '../../prefetch';
import {
  ROUTER_DATA_JSON_ID,
  SSR_DATA_JSON_ID,
  attributesToString,
} from '../utils';
import { SSRErrors, SSRTimings, SSRTracker } from '../tracker';
import { createLoadableCollector } from './loadable';
import { createRender } from './render';
import { createStyledCollector } from './styledComponent';
import {
  buildHtml,
  createReplaceChunkCss,
  createReplaceChunkJs,
  createReplaceHtml,
  createReplaceSSRDataScript,
} from './buildHtml';
import { RenderResult } from './type';

type EntryOptions = {
  ctx: SSRServerContext;
  App: ModernSSRReactComponent;
  config: SSRPluginConfig;
};

const buildTemplateData = (
  context: SSRServerContext,
  data: Record<string, any>,
  renderLevel: RenderLevel,
  tracker: SSRTracker,
) => {
  const { request, enableUnsafeCtx } = context;
  const unsafeContext = {
    headers: request.headers,
  };

  return {
    data,
    context: {
      request: {
        params: request.params,
        query: request.query,
        pathname: request.pathname,
        host: request.host,
        url: request.url,
        ...(enableUnsafeCtx ? unsafeContext : {}),
      },
      reporter: {
        sessionId: tracker.sessionId,
      },
    },
    renderLevel,
  };
};

export default class Entry {
  public entryName: string;

  public result: RenderResult;

  public metrics: SSRServerContext['metrics'];

  public tracker: SSRTracker;

  private readonly template: string;

  private readonly App: ModernSSRReactComponent;

  private readonly pluginConfig: SSRPluginConfig;

  private readonly htmlModifiers: SSRServerContext['htmlModifiers'];

  private readonly nonce?: string;

  constructor(options: EntryOptions) {
    const { ctx, config } = options;
    const { entryName, template, nonce } = ctx;

    this.template = template;
    this.entryName = entryName;
    this.App = options.App;
    this.pluginConfig = config;

    this.tracker = ctx.tracker;
    this.metrics = ctx.metrics;
    this.htmlModifiers = ctx.htmlModifiers;
    this.nonce = nonce;

    this.result = {
      renderLevel: RenderLevel.CLIENT_RENDER,
      html: '',
      chunksMap: {
        js: '',
        css: '',
      },
    };
  }

  public async renderToHtml(context: RuntimeContext): Promise<string> {
    const ssrContext = context.ssrContext!;

    if (ssrContext.redirection?.url) {
      return '';
    }

    const prefetchData = await this.prefetch(context);
    if (ssrContext.redirection?.url) {
      return '';
    }

    if (this.result.renderLevel >= RenderLevel.SERVER_PREFETCH) {
      this.result.html = this.renderToString(context);
    }
    if (ssrContext.redirection?.url) {
      return '';
    }

    const { routerContext } = context;
    const routerData = routerContext
      ? {
          loaderData: routerContext.loaderData,
          errors: serializeErrors(routerContext.errors),
        }
      : undefined;

    const templateData = buildTemplateData(
      ssrContext,
      prefetchData,
      this.result.renderLevel,
      this.tracker,
    );
    const ssrDataScripts = this.getSSRDataScript(templateData, routerData);

    const html = buildHtml(this.template, [
      createReplaceChunkCss(this.result.chunksMap.css),
      createReplaceChunkJs(this.result.chunksMap.js),
      createReplaceHtml(this.result.html || ''),
      createReplaceSSRDataScript(ssrDataScripts),
      ...this.htmlModifiers,
    ]);
    const helmetData: HelmetData = ReactHelmet.renderStatic();

    return helmetData ? helmetReplace(html, helmetData) : html;
  }

  private async prefetch(context: RuntimeContext) {
    let prefetchData;
    const end = time();

    try {
      prefetchData = await prefetch(this.App, context, this.pluginConfig);
      this.result.renderLevel = RenderLevel.SERVER_PREFETCH;
      const prefetchCost = end();

      this.tracker.trackTiming(SSRTimings.SSR_PREFETCH, prefetchCost);
    } catch (e) {
      this.result.renderLevel = RenderLevel.CLIENT_RENDER;
      this.tracker.trackError(SSRErrors.PREFETCH, e as Error);
    }

    return prefetchData || {};
  }

  private renderToString(context: RuntimeContext): string {
    let html = '';
    const end = time();
    const { ssrContext } = context;

    try {
      const App = React.createElement(this.App, {
        context: Object.assign(context, { ssr: true }),
      });

      html = createRender(App)
        .addCollector(createStyledCollector(this.result))
        .addCollector(
          createLoadableCollector({
            stats: ssrContext!.loadableStats,
            result: this.result,
            entryName: this.entryName,
            config: this.pluginConfig,
            nonce: this.nonce,
            template: this.template,
          }),
        )
        .finish();

      const cost = end();
      this.tracker.trackTiming(SSRTimings.SSR_RENDER_HTML, cost);
      this.result.renderLevel = RenderLevel.SERVER_RENDER;
    } catch (e) {
      this.tracker.trackError(SSRErrors.RENDER_HTML, e as Error);
    }

    return html;
  }

  private getSSRDataScript(
    templateData: ReturnType<typeof buildTemplateData>,
    routerData?: Record<string, any>,
  ) {
    const useInlineScript = this.pluginConfig.inlineScript !== false;
    const ssrData = serializeJson(templateData);
    const attrsStr = attributesToString({ nonce: this.nonce });

    let ssrDataScripts = useInlineScript
      ? `<script${attrsStr}>window._SSR_DATA = ${ssrData}</script>`
      : `<script type="application/json" id="${SSR_DATA_JSON_ID}">${ssrData}</script>`;

    if (routerData) {
      const serializedRouterData = serializeJson(routerData);
      ssrDataScripts += useInlineScript
        ? `\n<script${attrsStr}>window._ROUTER_DATA = ${serializedRouterData}</script>`
        : `\n<script type="application/json" id="${ROUTER_DATA_JSON_ID}">${serializedRouterData}</script>`;
    }
    return ssrDataScripts;
  }
}
