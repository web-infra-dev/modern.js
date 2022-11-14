import { RuntimeContext } from '../types';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';
import { InjectTemplate } from './type';

const HTML_SEPARATOR = '<!--<?- html ?>-->';

export function createTemplates(context: RuntimeContext) {
  const getTemplates: () => InjectTemplate = () => {
    const { template } = context.ssrContext!;
    const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
      template.split(HTML_SEPARATOR) || [];

    // templates injected some variables
    const builtBeforeTemplate = buildShellBeforeTemplate(beforeAppTemplate);
    const builtAfterTemplate = buildShellAfterTemplate(afterAppHtmlTemplate, {
      context,
    });

    return {
      shellBefore: builtBeforeTemplate,
      shellAfter: builtAfterTemplate,
    };
  };

  return getTemplates;
}
