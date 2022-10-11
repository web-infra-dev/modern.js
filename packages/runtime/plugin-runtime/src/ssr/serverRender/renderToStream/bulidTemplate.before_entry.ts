import ReactHelmet, { HelmetData } from 'react-helmet';
import { ChunkAsset } from '@loadable/server';
import helmetReplace from '../helmet';
import {
  HEAD_REG_EXP,
  BuildTemplateCb,
  buildTemplate,
} from './buildTemplate.share';

// build head template
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
    injectCss,
    // add preload loadableChunks
    injectPreloadLink,
    // handle React Helment
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

  // inject styled & loadableCssChunks into <!--<?- chunksMap.css ?>-->
  function injectCss(headTemplate: string) {
    return headTemplate.replace(
      '<!--<?- chunksMap.css ?>-->',
      getChunkCss(options),
    );

    function getChunkCss(options: GetHeadTemplateOptions) {
      const loadableCssChunks = options.loadableChunks?.filter(
        chunk => chunk.scriptType === 'style',
      );
      const stylelinks = loadableCssChunks.map((chunk: any) => {
        return `<link href="${chunk.url}" rel="stylesheet" />`;
      });
      return `
          ${options.styledComponentCSS || ''}
          ${stylelinks.join(' ')}
        `;
    }
  }

  // inject preload script source from loadableChunks
  function injectPreloadLink(headTemplate: string) {
    const loadableScriptChunks: any[] = options.loadableChunks?.filter(
      (chunk: any) => chunk.scriptType === 'script',
    );
    const scriptPreloadLinks = loadableScriptChunks.map(
      (chunk: any) => `<link rel="preload" href="${chunk.url}" as="script" />`,
    );
    return headTemplate.replace(
      '</head>',
      `${scriptPreloadLinks.join('')}</head>`,
    );
  }
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
