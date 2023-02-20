import React from 'react';
import ReactDomServer from 'react-dom/server';
import serialize from 'serialize-javascript';
import ReactHelmet, { HelmetData } from 'react-helmet';
import helmetReplace from '../helmet';
import {
  RenderLevel,
  RuntimeContext,
  ModernSSRReactComponent,
  SSRPluginConfig,
} from '../types';
import { time } from '../time';
import prefetch from '../../prefetch';
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
    },
    renderLevel,
  };
};

export default class Entry {
  public entryName: string;

  public result: RenderResult;

  public metrics: SSRServerContext['metrics'];

  public logger: SSRServerContext['logger'];

  private readonly App: ModernSSRReactComponent;

  private readonly fragments: Fragment[];

  private readonly pluginConfig: SSRPluginConfig;

  private readonly host: string;

  constructor(options: EntryOptions) {
    const { ctx, config } = options;
    const {
      entryName,
      template,
      request: { host },
    } = ctx;

    this.fragments = toFragments(template, entryName);
    this.entryName = entryName;
    this.host = host;
    this.App = options.App;
    this.pluginConfig = config;

    this.metrics = ctx.metrics;
    this.logger = ctx.logger;

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

    let html = '';
    const templateData = buildTemplateData(
      ssrContext,
      prefetchData,
      this.result.renderLevel,
    );
    const SSRData = this.getSSRDataScript(templateData);
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
      this.logger.debug(`App Prefetch cost = %d ms`, prefetchCost);
      this.metrics.emitTimer('app.prefetch.cost', prefetchCost);
    } catch (e) {
      this.result.renderLevel = RenderLevel.CLIENT_RENDER;
      this.logger.error('App Prefetch Render', e as Error);
      this.metrics.emitCounter('app.prefetch.render.error', 1);
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
      };
      html = reduce(App, renderContext, [
        styledComponentRenderer.toHtml,
        loadableRenderer.toHtml,
        (jsx: React.ReactElement) => ReactDomServer.renderToString(jsx),
      ]);

      const cost = end();
      this.logger.debug('App Render To HTML cost = %d ms', cost);
      this.metrics.emitTimer('app.render.html.cost', cost);
      this.result.renderLevel = RenderLevel.SERVER_RENDER;
    } catch (e) {
      this.logger.error('App Render To HTML', e as Error);
      this.metrics.emitCounter('app.render.html.error', 1);
    }

    return html;
  }

  private getSSRDataScript(templateData: ReturnType<typeof buildTemplateData>) {
    return {
      SSRDataScript: `
        <script>window._SSR_DATA = ${serialize(templateData, {
          isJSON: true,
        })}</script>
      `,
    };
  }
}
