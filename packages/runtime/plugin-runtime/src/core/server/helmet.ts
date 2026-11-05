import { EOL } from 'os';
import { applyDocumentHelmet } from '@modern-js/render/html';
import type { HelmetData } from 'react-helmet';

export { hasTitleTagBefore } from '@modern-js/render/html';

export function createReplaceHelemt(helmetData?: HelmetData) {
  return (template: string) =>
    helmetData ? helmetReplace(template, helmetData) : template;
}

export function helmetReplace(content: string, helmetData: HelmetData) {
  return applyDocumentHelmet(content, helmetData, { newline: EOL });
}
