import { RenderLevel, RuntimeContext } from '../types';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';
import { InjectTemplate } from './type';

const HTML_START_SEPARATOR = '<!--<?- html-start ?>-->';
const HTML_END_SEPARATOR = '<!--<?- html-end ?>-->';

export const getTemplates: (
  context: RuntimeContext,
  renderLevel: RenderLevel,
) => InjectTemplate = (context, renderLevel) => {
  const { ssrContext } = context;
  const { template } = ssrContext!;

  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] = [
    template.split(HTML_START_SEPARATOR).shift(),
    template.split(HTML_END_SEPARATOR).pop(),
  ];

  const builtBeforeTemplate = buildShellBeforeTemplate(
    beforeAppTemplate,
    context,
  );
  const builtAfterTemplate = buildShellAfterTemplate(afterAppHtmlTemplate, {
    ssrContext: ssrContext!,
    renderLevel,
  });

  return {
    shellBefore: builtBeforeTemplate,
    shellAfter: builtAfterTemplate,
  };
};
