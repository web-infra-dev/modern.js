/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import { isReact18 } from '../utils';
import { CHUNK_CSS_PLACEHOLDER } from './constants';

export default async function serverRender(options: any) {
  if (options.context.ssrContext?.template) {
    options.context.ssrContext.template =
      options.context.ssrContext?.template.replace(
        '</head>',
        `${CHUNK_CSS_PLACEHOLDER}</head>`,
      );
  }

  if (isReact18() && options.config.mode === 'stream') {
    const pipe = await require('./renderToStream').render(options);
    return pipe;
  } else {
    const html = await require('./renderToString').render(options);
    return html;
  }
}
