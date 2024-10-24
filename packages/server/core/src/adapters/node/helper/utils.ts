import type {
  HonoRequest,
  NodeRequest,
  NodeResponse,
  ServerManifest,
} from '../../../types';

type ExtendedNodeRequest = NodeRequest & {
  __honoRequest?: HonoRequest;
  __templates?: Record<string, string>;
  __serverManifest?: ServerManifest;
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

export const isResFinalized = (res: ExtendedNodeResponse): boolean => {
  return (
    res.headersSent ||
    res._modernBodyPiped ||
    res.writableEnded ||
    res.finished ||
    !res.socket?.writable
  );
};
