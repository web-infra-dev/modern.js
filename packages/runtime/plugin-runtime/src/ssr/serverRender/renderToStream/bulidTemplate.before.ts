import ReactHelmet, { HelmetData } from 'react-helmet';
// Todo: This import will introduce router code, like remix, even if router config is false
import { matchRoutes } from '@modern-js/runtime-utils/router';
import helmetReplace from '../helmet';
import { RuntimeContext, SSRPluginConfig } from '../types';
import { CHUNK_CSS_PLACEHOLDER } from '../constants';
import { checkIsNode, safeReplace } from '../utils';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

const readAsset = async (chunk: string) => {
  // working node env
  const fs = await import('fs/promises');
  const path = await import('path');

  // only working in 'production' env
  // we need ensure the assetsDir is same as ssr bundles.
  const filepath = path.join(__dirname, chunk);

  return fs.readFile(filepath, 'utf-8');
};

const checkIsInline = (
  chunk: string,
  enableInline: boolean | RegExp | undefined,
) => {
  // only production apply the inline config
  if (process.env.NODE_ENV === 'production') {
    if (enableInline instanceof RegExp) {
      return enableInline.test(chunk);
    } else {
      return Boolean(enableInline);
    }
  } else {
    return false;
  }
};

export async function buildShellBeforeTemplate(
  beforeAppTemplate: string,
  context: RuntimeContext,
  pluginConfig: SSRPluginConfig,
  styledComponentsStyleTags?: string,
) {
  const helmetData: HelmetData = ReactHelmet.renderStatic();
  const callbacks: BuildTemplateCb[] = [
    headTemplate => {
      return helmetData
        ? helmetReplace(headTemplate, helmetData)
        : headTemplate;
    },
    // @TODO: prefetch scripts of lazy component
    template => injectCss(template, styledComponentsStyleTags),
  ];

  return buildTemplate(beforeAppTemplate, callbacks);

  async function injectCss(
    template: string,
    styledComponentsStyleTags?: string,
  ) {
    let css = await getCssChunks();
    if (styledComponentsStyleTags) {
      css += styledComponentsStyleTags;
    }
    return safeReplace(template, CHUNK_CSS_PLACEHOLDER, css);

    async function getCssChunks() {
      const { routeManifest, routerContext, routes } = context;
      if (!routeManifest || !routerContext || !routes) {
        return '';
      }

      const { routeAssets } = routeManifest;
      const cssChunks: string[] = [];

      const matches = matchRoutes(
        routes,
        routerContext.location,
        routerContext.basename,
      );
      matches?.forEach((match, index) => {
        // root layout css chunks should't be loaded
        if (!index) {
          return;
        }

        const routeId = match.route.id;
        if (routeId) {
          const routeManifest = routeAssets[routeId];
          if (routeManifest) {
            const { referenceCssAssets = [] } = routeManifest as {
              referenceCssAssets?: string[];
            };
            const _cssChunks = referenceCssAssets.filter(
              (asset?: string) =>
                asset?.endsWith('.css') && !template.includes(asset),
            );
            cssChunks.push(..._cssChunks);
          }
        }
      });

      const { enableInlineStyles } = pluginConfig;
      const styles = await Promise.all(
        cssChunks.map(async chunk => {
          const link = `<link href="${chunk}" rel="stylesheet" />`;
          if (checkIsNode() && checkIsInline(chunk, enableInlineStyles)) {
            return readAsset(chunk)
              .then(content => `<style>${content}</style>`)
              .catch(_ => {
                // if read file occur error, we should return link to import css assets.
                return link;
              });
          } else {
            return link;
          }
        }),
      );

      return `${styles.join('')}`;
    }
  }
}
