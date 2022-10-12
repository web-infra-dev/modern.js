/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */

import { isReact18 } from '../utils';
import { RuntimeContext } from './types';

export default async function serverRender(
  App: React.ElementType<any>,
  context?: RuntimeContext,
  ssrMode: 'stream' | 'string' = 'string',
) {
  if (isReact18() && ssrMode === 'stream') {
    const pipe = await require('./renderToStream').render(context, App);
    return pipe;
  } else {
    const html = await require('./renderToString').render(context, App);
    return html;
  }
}
