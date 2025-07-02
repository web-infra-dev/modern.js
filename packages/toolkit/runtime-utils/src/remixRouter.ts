export * from '@remix-run/router';

import * as remixRouter from '@remix-run/router';

const symbolName = 'UNSAFE_DEFERRED_SYMBOL';

export const DEFERRED_SYMBOL =
  symbolName in remixRouter
    ? ((remixRouter as any)[symbolName] as symbol)
    : Symbol('deferred');
