import path from 'path';
import { LOADABLE_STATS_FILE } from '@modern-js/utils';
import React from 'react';
import { RuntimeContext } from '@modern-js/runtime-core';
import ReactDomServer from 'react-dom/server';
import serialize from 'serialize-javascript';
import ReactHelmet, { HelmetData } from 'react-helmet';
import { Fragment, toFragments } from './template';
import {
  ModernSSRReactComponent,
  RenderLevel,
  SSRServerContext,
  RenderResult,
} from './type';

import helmetReplace from './helmet';
import { reduce } from './reduce';
import * as loadableRenderer from './loadable';
import * as styledComponentRenderer from './styledComponent';

type EntryOptions = {
  name: string;
  template: string;
  App: ModernSSRReactComponent;
};

const buildTemplateData = (
  context: SSRServerContext,
  data: Record<string, any>,
  renderLevel: RenderLevel,
) => {
  const { request } = context;
  return {
    data,
    context: {
      request: {
        params: request.params,
        query: request.query,
        pathname: request.pathname,
        headers: request.headers,
      },
    },
    renderLevel,
  };
};

export default class Entry {
  public entryName: string;

  public result: RenderResult;

  private readonly App: ModernSSRReactComponent;

  private readonly fragments: Fragment[];

  constructor(options: EntryOptions) {
    this.fragments = toFragments(options.template);
    this.entryName = options.name;
    this.App = options.App;

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
    const { ssrContext } = context;

    if (ssrContext.redirection.url) {
      return '';
    }

    const prefetchData = await this.prefetch(context);
    if (ssrContext.redirection.url) {
      return '';
    }

    if (this.result.renderLevel >= RenderLevel.SERVER_PREFETCH) {
      this.result.html = this.renderToString(context);
    }
    if (ssrContext.redirection.url) {
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
    const {
      App: { prefetch },
    } = this;

    let prefetchData;

    try {
      prefetchData = prefetch ? await prefetch(context) : null;
      this.result.renderLevel = RenderLevel.SERVER_PREFETCH;
    } catch (e) {
      // 这个逻辑基本不会走进来，prefecth 内部会做 catch
      this.result.renderLevel = RenderLevel.CLIENT_RENDER;
      console.error('SSR Error - App Prefetch error = %s', e);
    }

    return prefetchData || {};
  }

  private renderToString(context: RuntimeContext): string {
    let html = '';

    try {
      const App = React.createElement(this.App, {
        context: Object.assign(context, { ssr: true }),
      });

      // Todo render Hook
      const renderContext = {
        loadableManifest: path.resolve(
          context.ssrContext.distDir,
          LOADABLE_STATS_FILE,
        ),
        result: this.result,
        entryName: this.entryName,
      };
      html = reduce(App, renderContext, [
        loadableRenderer.toHtml,
        styledComponentRenderer.toHtml,
        (jsx: React.ReactElement) => ReactDomServer.renderToString(jsx),
      ]);

      this.result.renderLevel = RenderLevel.SERVER_RENDER;
    } catch (e) {
      console.error('SSR Error - App Render To HTML error = %s', e);
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
