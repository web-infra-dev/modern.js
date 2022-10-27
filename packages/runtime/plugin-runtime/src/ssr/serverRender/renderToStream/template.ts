import type { ServerStyleSheet } from 'styled-components';
import type { ChunkExtractor } from '@loadable/server';
import React from 'react';
import {
  RuntimeContext,
  ModernSSRReactComponent,
  SSRPluginConfig,
} from '../types';
import { getLoadableScripts } from '../utils';
import { getLoadableChunks } from './loadable';
import { getStyledComponentCss } from './styledComponent';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';
import { InjectTemplate } from './type';

const HTML_SEPARATOR = '<!--<?- html ?>-->';

export function createTemplates(
  context: RuntimeContext,
  rootElement: React.ReactElement,
  prefetchData: Record<string, any>,
  App: ModernSSRReactComponent,
  config: SSRPluginConfig,
) {
  const {
    jsx,
    chunkExtractor,
    styleSheet,
  }: {
    context?: RuntimeContext;
    jsx: React.ReactElement;
    chunkExtractor?: ChunkExtractor;
    styleSheet?: ServerStyleSheet;
  } = [getStyledComponentCss, getLoadableChunks].reduce(
    (params, handler) => {
      return {
        ...(params || {}),
        ...handler({
          jsx: params.jsx,
          context: params.context,
        }),
      };
    },
    {
      context,
      jsx: rootElement,
    },
  );
  const getTemplates: () => InjectTemplate = () => {
    const { template } = context.ssrContext!;
    const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
      template.split(HTML_SEPARATOR) || [];

    // prepare inject objects.
    const loadableChunks =
      chunkExtractor?.getChunkAssets(chunkExtractor.chunks) || [];
    const loadableScripts = getLoadableScripts(chunkExtractor!);
    const styledComponentCSS = styleSheet?.getStyleTags() || '';

    // templates injected some variables
    const builtBeforeTemplate = buildShellBeforeTemplate(beforeAppTemplate, {
      loadableChunks,
      styledComponentCSS,
    });
    const builtAfterTemplate = buildShellAfterTemplate(afterAppHtmlTemplate, {
      loadableScripts,
      loadableChunks,
      App,
      context,
      prefetchData,
      ssrConfig: config,
    });

    return {
      shellBefore: builtBeforeTemplate,
      shellAfter: builtAfterTemplate,
    };
  };

  return {
    jsx,
    getTemplates,
  };
}
