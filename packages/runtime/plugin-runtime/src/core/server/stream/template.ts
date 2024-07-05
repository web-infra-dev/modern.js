import {
  buildShellBeforeTemplate,
  type BuildShellBeforeTemplateOptions,
} from './beforeTemplate';
import {
  buildShellAfterTemplate,
  type BuildShellAfterTemplateOptions,
} from './afterTemplate';

export type InjectTemplate = {
  shellBefore: string;
  shellAfter: string;
};

const HTML_SEPARATOR = '<!--<?- html ?>-->';

type GetTemplatesOptions = BuildShellAfterTemplateOptions &
  BuildShellBeforeTemplateOptions;

export const getTemplates = async (
  htmlTemplate: string,
  options: GetTemplatesOptions,
): Promise<InjectTemplate> => {
  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
    htmlTemplate.split(HTML_SEPARATOR) || [];

  const builtBeforeTemplate = await buildShellBeforeTemplate(
    beforeAppTemplate,
    options,
  );

  const builtAfterTemplate = await buildShellAfterTemplate(
    afterAppHtmlTemplate,
    options,
  );

  return {
    shellBefore: builtBeforeTemplate,
    shellAfter: builtAfterTemplate,
  };
};
