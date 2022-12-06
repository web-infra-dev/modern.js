import ReactHelmet, { HelmetData } from 'react-helmet';
import { matchRoutes } from 'react-router-dom';
import helmetReplace from '../helmet';
import { RuntimeContext } from '../types';
import {
  HEAD_REG_EXP,
  BuildTemplateCb,
  buildTemplate,
} from './buildTemplate.share';

const CSS_CHUNKS_PLACEHOLDER = '<!--<?- chunksMap.css ?>-->';
const ROOT_LAYOUT = 'layout';

// build head template
function getHeadTemplate(beforeEntryTemplate: string, context: RuntimeContext) {
  const callbacks: BuildTemplateCb[] = [
    headTemplate => {
      const helmetData: HelmetData = ReactHelmet.renderStatic();
      return helmetData
        ? helmetReplace(headTemplate, helmetData)
        : headTemplate;
    },
    // @TODO: prefetch scripts of lazy component
    injectCss,
  ];

  const [headTemplate = ''] = beforeEntryTemplate.match(HEAD_REG_EXP) || [];
  if (!headTemplate.length) {
    return '';
  }
  return buildTemplate(headTemplate, callbacks);

  function injectCss(headTemplate: string) {
    return headTemplate.replace(CSS_CHUNKS_PLACEHOLDER, getCssChunks());

    function getCssChunks() {
      const { routeManifest, routerContext, routes } = context;
      if (!routeManifest || !routerContext || !routes) {
        return '';
      }

      const { routeAssets } = routeManifest;
      const cssChunks: string[] = [];

      const matches = matchRoutes(routes, routerContext.location);
      matches?.forEach(match => {
        const routeId = match.route.id;

        if (routeId && routeId !== ROOT_LAYOUT) {
          const { assets = [] } = routeAssets[routeId];
          const _cssChunks = assets.filter((asset?: string) =>
            asset?.endsWith('.css'),
          );
          cssChunks.push(..._cssChunks);
        }
      });

      const styleLinks = cssChunks.map((chunk: string) => {
        return `<link href="${chunk}" rel="stylesheet" />`;
      });

      return `${styleLinks.join('')}`;
    }
  }
}

// build script
export function buildShellBeforeTemplate(
  beforeAppTemplate: string,
  context: RuntimeContext,
) {
  const headTemplate = getHeadTemplate(beforeAppTemplate, context);
  return beforeAppTemplate.replace(HEAD_REG_EXP, headTemplate);
}
