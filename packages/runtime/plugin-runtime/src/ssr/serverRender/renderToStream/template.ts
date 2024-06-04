import { RenderLevel, RuntimeContext, SSRPluginConfig } from '../types';
import { buildShellAfterTemplate } from './buildTemplate.after';
import { buildShellBeforeTemplate } from './bulidTemplate.before';

export type InjectTemplate = {
  shellBefore: string;
  shellAfter: string;
};

const HTML_SEPARATOR = '<!--<?- html ?>-->';

export const getTemplates = async (
  context: RuntimeContext,
  renderLevel: RenderLevel,
  pluginConfig: SSRPluginConfig,
  styledComponentsStyleTags?: string,
): Promise<InjectTemplate> => {
  const { ssrContext } = context;
  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
    ssrContext!.template.split(HTML_SEPARATOR) || [];

  const builtBeforeTemplate = await buildShellBeforeTemplate(
    beforeAppTemplate,
    context,
    pluginConfig,
    styledComponentsStyleTags,
  );
  const builtAfterTemplate = await buildShellAfterTemplate(
    afterAppHtmlTemplate,
    {
      context,
      renderLevel,
    },
  );

  return {
    shellBefore: builtBeforeTemplate,
    shellAfter: builtAfterTemplate,
  };
};
