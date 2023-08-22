import type { Reporter } from '@modern-js/types';
import { createLoaderContext } from './createLoaderCtx';

export { createRequestContext, type RequestContext } from './createRequestCtx';

export const reporterCtx = createLoaderContext<Reporter>();
