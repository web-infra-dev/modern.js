import { RenderLevel, SSRServerContext } from '../types';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';
import { InjectTemplate } from './type';

const HTML_SEPARATOR = '<!--<?- html ?>-->';

export const getTemplates: (
  ssrContext: SSRServerContext,
  renderLevel: RenderLevel,
) => InjectTemplate = (ssrContext, renderLevel) => {
  const { template } = ssrContext;
  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
    template.split(HTML_SEPARATOR) || [];

  // templates injected some variables
  const builtBeforeTemplate = buildShellBeforeTemplate(beforeAppTemplate);
  const builtAfterTemplate = buildShellAfterTemplate(afterAppHtmlTemplate, {
    ssrContext,
    renderLevel,
  });

  return {
    shellBefore: builtBeforeTemplate,
    shellAfter: builtAfterTemplate,
  };
};
