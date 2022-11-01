import { parseError } from '../shared/utils';
import { ErrorTransformer } from '../shared/types';

export const transformConnectAttachedHead: ErrorTransformer = e => {
  if (e.name === 'ChunkRenderError' && 'error' in e) {
    const attached = parseError((e as any).error);
    e.trace.splice(0, 0, attached.trace[0]);
  }
};
