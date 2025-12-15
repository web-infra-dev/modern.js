import type {
  ClientManifest,
  NodeRequest,
  NodeResponse,
  SSRManifest,
} from '@modern-js/types/server';
import type { HonoRequest, ServerManifest } from '../../../types';

type ExtendedNodeRequest = NodeRequest & {
  __honoRequest?: HonoRequest;
  __templates?: Record<string, string>;
  __serverManifest?: ServerManifest;
  __rscServerManifest?: ServerManifest;
  __rscClientManifest?: ClientManifest;
  __rscSSRManifest?: SSRManifest;
};

type ExtendedNodeResponse = NodeResponse & {
  _modernBodyPiped?: boolean;
};

export type NodeBindings = {
  node: {
    req: ExtendedNodeRequest;
    res: ExtendedNodeResponse;
  };
};
