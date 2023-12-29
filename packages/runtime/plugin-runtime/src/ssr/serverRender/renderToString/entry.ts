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
  RenderResult,
} from '../types';
import prefetch from '../../prefetch';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { attributesToString } from '../utils';
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
  config: SSRPluginConfig,
) => {
  const { request } = context;
  const { unsafeHeaders } = config;

  const headers = unsafeHeaders
    ? Object.fromEntries(
        Object.entries(request.headers).filter(([key, _]) => {
          return unsafeHeaders
            ?.map(header => header.toLowerCase())
            ?.includes(key.toLowerCase());
        }),
      )
    : undefined;

  return {
    data,
    context: {
      request: {
        params: request.params,
        query: request.query,
        pathname: request.pathname,
        host: request.host,
        url: request.url,
        headers,
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

  public tracker: SSRTracker;

  private readonly template: string;

  private readonly App: ModernSSRReactComponent;

  private readonly pluginConfig: SSRPluginConfig;

  private readonly htmlModifiers: SSRServerContext['htmlModifiers'];

  private readonly nonce?: string;

  private readonly routeManifest?: Record<string, any>;

  constructor(options: EntryOptions) {
    const { ctx, config } = options;
    const { entryName, template, nonce } = ctx;

    this.template = template;
    this.entryName = entryName;
    this.App = options.App;
    this.pluginConfig = config;

    this.routeManifest = ctx.routeManifest;
    this.tracker = ctx.tracker;
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
      this.result.html = await this.renderToString(context);
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
      this.pluginConfig,
    );
    const ssrDataScripts = this.getSSRDataScript(templateData, routerData);

    const html = buildHtml(this.template, [
      createReplaceChunkCss(this.result.chunksMap.css),
      createReplaceChunkJs(this.result.chunksMap.js),
      createReplaceSSRDataScript(ssrDataScripts),
      createReplaceHtml(this.result.html || ''),
      ...this.htmlModifiers,
    ]);
    const helmetData: HelmetData = ReactHelmet.renderStatic();

    return helmetData ? helmetReplace(html, helmetData) : html;
  }

  private async prefetch(context: RuntimeContext) {
    let prefetchData;

    try {
      prefetchData = await prefetch(
        this.App,
        context,
        this.pluginConfig,
        this.tracker,
      );
      this.result.renderLevel = RenderLevel.SERVER_PREFETCH;
    } catch (e) {
      this.result.renderLevel = RenderLevel.CLIENT_RENDER;
    }

    return prefetchData || {};
  }

  private async renderToString(context: RuntimeContext): Promise<string> {
    let html = '';
    const end = time();
    const { ssrContext } = context;

    try {
      const App = React.createElement(this.App, {
        context: Object.assign(context, { ssr: true }),
      });

      html = await createRender(App)
        .addCollector(createStyledCollector(this.result))
        .addCollector(
          createLoadableCollector({
            stats: ssrContext!.loadableStats,
            result: this.result,
            entryName: this.entryName,
            config: this.pluginConfig,
            nonce: this.nonce,
            template: this.template,
            routeManifest: this.routeManifest,
          }),
        )
        .finish();

      const cost = end();
      this.tracker.trackTiming(SSRTimings.RENDER_HTML, cost);
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
