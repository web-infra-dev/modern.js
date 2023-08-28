import { RenderLevel, RuntimeContext } from '../types';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';

export type InjectTemplate = {
  shellBefore: string;
  shellAfter: string;
};

const HTML_SEPARATOR = '<!--<?- html ?>-->';

export const getTemplates: (
  context: RuntimeContext,
  renderLevel: RenderLevel,
) => InjectTemplate = (context, renderLevel) => {
  const { ssrContext } = context;
  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
    ssrContext!.template.split(HTML_SEPARATOR) || [];

  const builtBeforeTemplate = buildShellBeforeTemplate(
    beforeAppTemplate,
    context,
  );
  const builtAfterTemplate = buildShellAfterTemplate(afterAppHtmlTemplate, {
    context,
    renderLevel,
  });

  return {
    shellBefore: builtBeforeTemplate,
    shellAfter: builtAfterTemplate,
  };
};
