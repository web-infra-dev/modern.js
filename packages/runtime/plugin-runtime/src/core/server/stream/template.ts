import {
  type BuildShellAfterTemplateOptions,
  buildShellAfterTemplate,
} from './afterTemplate';
import {
  type BuildShellBeforeTemplateOptions,
  buildShellBeforeTemplate,
} from './beforeTemplate';

export type InjectTemplate = {
  shellBefore: string;
  shellAfter: string;
};

const HTML_SEPARATOR = '<!--<?- html ?>-->';

type GetTemplatesOptions = BuildShellAfterTemplateOptions &
  BuildShellBeforeTemplateOptions;

/**
 * Splits the HTML template into the parts before and after the app root.
 */
export function splitHtmlTemplate(htmlTemplate: string) {
  const [beforeAppTemplate = '', afterAppHtmlTemplate = ''] =
    htmlTemplate.split(HTML_SEPARATOR) || [];
  return { beforeAppTemplate, afterAppHtmlTemplate };
}

export const getTemplates = async (
  htmlTemplate: string,
  options: GetTemplatesOptions,
): Promise<InjectTemplate> => {
  const { beforeAppTemplate, afterAppHtmlTemplate } =
    splitHtmlTemplate(htmlTemplate);

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
