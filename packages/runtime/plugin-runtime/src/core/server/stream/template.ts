import { SSR_DATA_PLACEHOLDER } from '../constants';
import { attributesToString } from '../utils';
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

  if (!htmlTemplate.includes(SSR_DATA_PLACEHOLDER)) {
    return {
      shellBefore: builtBeforeTemplate,
      shellAfter: builtAfterTemplate,
    };
  }

  const attributes = attributesToString({ nonce: options.config.nonce });
  const pendingScript = `<script${attributes}>window._SSR_DATA_READY = new Promise(function(resolve){window._SSR_DATA_READY_RESOLVE = resolve;});</script>`;
  const readyScript = `<script${attributes}>window._SSR_DATA_READY_RESOLVE();delete window._SSR_DATA_READY_RESOLVE;</script>`;
  // Establish the handshake before any async entry can execute. Resolve only
  // after the shell's SSR and router data; later Suspense chunks stay streaming.
  const firstScript = builtBeforeTemplate.search(/<script[\s>]/i);
  const head = /<head(?:\s[^>]*)?>/i.exec(builtBeforeTemplate);
  const insertion = head
    ? head.index + head[0].length
    : firstScript >= 0
      ? firstScript
      : builtBeforeTemplate.length;

  return {
    shellBefore:
      builtBeforeTemplate.slice(0, insertion) +
      pendingScript +
      builtBeforeTemplate.slice(insertion),
    shellAfter: `${builtAfterTemplate}${readyScript}`,
  };
};
