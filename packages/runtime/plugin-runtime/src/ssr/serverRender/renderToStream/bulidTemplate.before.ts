import ReactHelmet, { HelmetData } from 'react-helmet';
// Todo: This import will introduce router code, like remix, even if router config is false
import { matchRoutes } from '@modern-js/runtime-utils/router';
import helmetReplace from '../helmet';
import { RuntimeContext } from '../types';
import { CHUNK_CSS_PLACEHOLDER } from '../constants';
import { safeReplace } from '../utils';
import {
  HEAD_REG_EXP,
  BuildTemplateCb,
  buildTemplate,
} from './buildTemplate.share';

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
    return safeReplace(headTemplate, CHUNK_CSS_PLACEHOLDER, getCssChunks());

    function getCssChunks() {
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
                asset?.endsWith('.css') && !headTemplate.includes(asset),
            );
            cssChunks.push(..._cssChunks);
          }
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
