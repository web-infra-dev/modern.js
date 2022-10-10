/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import path from 'path';
import { isReact18 } from '../utils';
import { RuntimeContext } from './types';

export default async function serverRender(
  App: React.ElementType<any>,
  context?: RuntimeContext,
) {
  if (isReact18()) {
    const pipe = await require('./renderToStream').render(context, App);
    return pipe;
  } else {
    const html = await require('./renderToString').render(
      context,
      context?.ssrContext?.distDir || path.join(process.cwd(), 'dist'),
      App,
    );
    return html;
  }
}
