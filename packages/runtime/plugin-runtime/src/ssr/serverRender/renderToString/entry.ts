import React from 'react';
import ReactDomServer from 'react-dom/server';
import { serializeJson } from '@modern-js/utils/runtime-node';
import ReactHelmet, { HelmetData } from 'react-helmet';
// Todo: This import will introduce router code, like remix, even if router config is false
import { time } from '@modern-js/utils/universal/time';
import { serializeErrors } from '../../../router/runtime/utils';
import helmetReplace from '../helmet';
import {
  RenderLevel,
  RuntimeContext,
  ModernSSRReactComponent,
  SSRPluginConfig,
} from '../types';
import prefetch from '../../prefetch';
import {
  ROUTER_DATA_JSON_ID,
  SSR_DATA_JSON_ID,
  attributesToString,
} from '../utils';
import {
  SSRErrors,
  SSRTimings,
  SSRTracker,
  createSSRTracker,
} from '../tracker';
import { SSRServerContext, RenderResult } from './type';
import { Fragment, toFragments } from './template';
import { reduce } from './reduce';
import * as loadableRenderer from './loadable';
import * as styledComponentRenderer from './styledComponent';

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

  private readonly fragments: Fragment[];

  private readonly pluginConfig: SSRPluginConfig;

  private readonly host: string;

  private readonly nonce?: string;

  constructor(options: EntryOptions) {
    const { ctx, config } = options;
    const {
      entryName,
      template,
      request: { host },
      nonce,
    } = ctx;

    this.fragments = toFragments(template, entryName);
    this.template = template;
    this.entryName = entryName;
    this.host = host;
    this.App = options.App;
    this.pluginConfig = config;

    this.tracker = createSSRTracker(ctx);
    this.metrics = ctx.metrics;
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

    let html = '';
    const templateData = buildTemplateData(
      ssrContext,
      prefetchData,
      this.result.renderLevel,
      this.tracker,
    );
    const SSRData = this.getSSRDataScript(templateData, routerData);
    for (const fragment of this.fragments) {
      if (fragment.isVariable && fragment.content === 'SSRDataScript') {
        html += fragment.getValue(SSRData);
      } else {
        html += fragment.getValue(this.result);
      }
    }

    const helmetData: HelmetData = ReactHelmet.renderStatic();

    return helmetData ? helmetReplace(html, helmetData) : html;
  }

  private async prefetch(context: RuntimeContext) {
    let prefetchData;
    const end = time();

    try {
      prefetchData = await prefetch(this.App, context);
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

      const renderContext = {
        stats: ssrContext!.loadableStats,
        host: this.host,
        result: this.result,
        entryName: this.entryName,
        config: this.pluginConfig,
        nonce: this.nonce,
        template: this.template,
      };
      html = reduce(App, renderContext, [
        styledComponentRenderer.toHtml,
        loadableRenderer.toHtml,
        (jsx: React.ReactElement) => ReactDomServer.renderToString(jsx),
      ]);

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
    return {
      SSRDataScript: ssrDataScripts,
    };
  }
}
