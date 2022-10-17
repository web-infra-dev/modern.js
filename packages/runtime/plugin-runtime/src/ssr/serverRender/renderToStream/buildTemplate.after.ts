import { ChunkAsset } from '@loadable/server';
import { RuntimeContext } from 'src/runtime-context';
import serialize from 'serialize-javascript';
import { isCrossOrigin } from 'src/ssr/utils';
import { ModernSSRReactComponent, SSRPluginConfig } from '../types';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildShellAfterTemplateOptions = {
  loadableChunks: ChunkAsset[];
  context: RuntimeContext;
  App: ModernSSRReactComponent;
  loadableScripts: string;
  prefetchData: Record<string, any>;
  ssrConfig: SSRPluginConfig;
};
export function buildShellAfterTemplate(
  afterAppTemplate: string,
  options: BuildShellAfterTemplateOptions,
) {
  const callbacks: BuildTemplateCb[] = [injectScript, injectSSRDataScript];
  return buildTemplate(afterAppTemplate, callbacks);

  // inject scripts from loadable
  function injectScript(template: string) {
    return template.replace(
      '<!--<?- chunksMap.js ?>-->',
      getloadableScripts(
        options.loadableChunks,
        options.loadableScripts,
        options.ssrConfig.crossorigin,
      ),
    );

    function getloadableScripts(
      loadableChunks: ChunkAsset[],
      loadableScript: string,
      crossorigin: SSRPluginConfig['crossorigin'],
    ) {
      const loadableJsChunks = loadableChunks.filter(
        chunk => chunk.scriptType === 'script',
      );
      const loadableScripts = loadableJsChunks
        .map(chunk => {
          const host = options.context.ssrContext?.request.host;
          if (crossorigin && isCrossOrigin(chunk.url, host || '')) {
            return `<script crossorigin="${
              crossorigin === true ? 'anonymous' : crossorigin
            }" src="${chunk.url}"></script>`;
          } else {
            return `<script src="${chunk.url}"></script>`;
          }
        })
        .concat([loadableScript]);
      return loadableScripts.join('\n');
    }
  }

  function injectSSRDataScript(template: string) {
    const ssrDataScript = buildSSRDataScript(options.prefetchData);
    return template.replace('<!--<?- SSRDataScript ?>-->', ssrDataScript);

    function buildSSRDataScript(prefetchData: any) {
      const { ssrContext } = options.context;
      const { request } = ssrContext!;
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
  }
}
