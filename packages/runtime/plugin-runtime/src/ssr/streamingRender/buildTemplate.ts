import ReactHelmet, { HelmetData } from 'react-helmet';
import { ChunkAsset } from '@loadable/server';
import { RuntimeContext } from 'src/runtime-context';
import serialize from 'serialize-javascript';
import helmetReplace from '../serverRender/helmet';
import { ModernSSRReactComponent } from '../serverRender/type';

// share script
const HEAD_REG_EXP = /<head(.|\n)*>(.|\n)*<\/head>/;
type BuildTemplateCb = (headTemplate: string) => string;
function buildTemplate(template: string, callbacks: BuildTemplateCb[]) {
  return callbacks.reduce(
    (template, buildTemplateCb) => buildTemplateCb(template),
    template,
  );
}

// utils script
type GetHeadTemplateOptions = {
  loadableChunks: ChunkAsset[];
  styledComponentCSS: string;
  [property: string]: any;
};
function getHeadTemplate(
  beforeEntryTemplate: string,
  options: GetHeadTemplateOptions,
) {
  const callbacks: BuildTemplateCb[] = [
    // add styled css
    headTemplate => {
      return headTemplate.replace(
        '<!--<?- chunksMap.css ?>-->',
        getChunkCss(options),
      );

      function getChunkCss(options: GetHeadTemplateOptions) {
        const loadableCssChunks: any[] = options.loadableChunks?.filter(
          (chunk: any) => chunk.scriptType === 'style',
        );
        const stylelinks = loadableCssChunks.map((chunk: any) => {
          return `<link href="${chunk.url}" rel="stylesheet" />`;
        });
        return `
          ${options.loadableChunks || ''}
          ${stylelinks.join(' ')}
        `;
      }
    },
    // add preload loadableChunks
    headTemplate => {
      const loadableScriptChunks: any[] = options.loadableChunks?.filter(
        (chunk: any) => chunk.scriptType === 'script',
      );
      const scriptPreloadLinks = loadableScriptChunks.map(
        (chunk: any) =>
          `<link rel="preload" href="${chunk.url}" as="script" />`,
      );
      return headTemplate.replace(
        '</head>',
        `${scriptPreloadLinks.join('')}</head>`,
      );
    },
    // handle React Helmen
    headTemplate => {
      const helmetData: HelmetData = ReactHelmet.renderStatic();
      return helmetData
        ? helmetReplace(headTemplate, helmetData)
        : headTemplate;
    },
  ];
  const [headTemplate = ''] = beforeEntryTemplate.match(HEAD_REG_EXP) || [];
  if (!headTemplate.length) {
    return '';
  }
  return buildTemplate(headTemplate, callbacks);
}

// build script
type BuildBeforeEntryTemplateOptions = GetHeadTemplateOptions;
export function buildBeforeEntryTemplate(
  beforeEntryTemplate: string,
  options: BuildBeforeEntryTemplateOptions,
) {
  const headTemplate = getHeadTemplate(beforeEntryTemplate, {
    loadableChunks: options.loadableChunks,
    styledComponentCSS: options.styledComponentCSS,
  });
  return beforeEntryTemplate.replace(HEAD_REG_EXP, headTemplate);
}

type BuildAfterEntryTemplate = {
  loadableChunks: ChunkAsset[];
};
export function buildAfterEntryTemplate(
  afterEntryTemplate: string,
  options: BuildAfterEntryTemplate,
) {
  const callbacks: BuildTemplateCb[] = [
    template => {
      return template.replace(
        '<!--<?- chunksMap.js ?>-->',
        getloadableScripts(options.loadableChunks),
      );
      function getloadableScripts(loadableChunks: ChunkAsset[]) {
        const loadableJsChunks = loadableChunks.filter(
          chunk => chunk.scriptType === 'script',
        );
        const loadableScripts = loadableJsChunks.map(
          chunk => `<script src="${chunk.url}"></script>`,
        );
        return loadableScripts.join('\n');
      }
    },
  ];

  return buildTemplate(afterEntryTemplate, callbacks);
}

type BuildAfterLeaveTemplateOptions = {
  App: ModernSSRReactComponent;
  context: RuntimeContext;
};
export async function buildAfterLeaveTemplate(
  options: BuildAfterLeaveTemplateOptions,
) {
  const prefetchData = await prefetch(options.App, options.context);
  const ssrDataScript = buildSSRDataScript(prefetchData);
  let afterLeaveTemplate = '';
  afterLeaveTemplate += ssrDataScript;
  return afterLeaveTemplate;

  function buildSSRDataScript(prefetchData: any) {
    const { request } = options.context;
    const SSRData = {
      data: prefetchData,
      context: {
        request: {
          params: request.params,
          query: request.query,
          pathname: request.pathname,
          host: request.host,
          url: request.url,
          headers: request.headers,
          cookieMap: request.cookieMap,
        },
      },
    };
    return `
    <script>window._SSR_DATA = ${serialize(SSRData, {
      isJSON: true,
    })}</script>
    `;
  }
  async function prefetch(
    App: ModernSSRReactComponent,
    context: RuntimeContext,
  ) {
    const { prefetch } = App;

    let prefetchData;
    // const end = time();

    try {
      prefetchData = prefetch ? await prefetch(context) : null;
      // const prefetchCost = end();
      // this.logger.debug(`App Prefetch cost = %d ms`, prefetchCost);
      // this.metrics.emitTimer('app.prefetch.cost', prefetchCost);
    } catch (e) {
      // this.logger.error('App Prefetch Render', e as Error);s
      // this.metrics.emitCounter('app.prefetch.render.error', 1);
    }

    return prefetchData || {};
  }
}
