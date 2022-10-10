import { ChunkAsset } from '@loadable/server';
import { RuntimeContext } from 'src/runtime-context';
import serialize from 'serialize-javascript';
import { ModernSSRReactComponent } from '../types';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildAfterEntryTemplate = {
  loadableChunks: ChunkAsset[];
  context: RuntimeContext;
  App: ModernSSRReactComponent;
  prefetchData: Record<string, any>;
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
    template => {
      const ssrDataScript = buildSSRDataScript(options.prefetchData);
      return template.replace('<!--<?- SSRDataScript ?>-->', ssrDataScript);
    },
  ];

  return buildTemplate(afterEntryTemplate, callbacks);

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
