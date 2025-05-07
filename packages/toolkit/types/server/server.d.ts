import type { IncomingMessage, ServerResponse } from 'http';
import type { Http2ServerRequest, Http2ServerResponse } from 'http2';

export type NodeRequest = IncomingMessage | Http2ServerRequest;
export type NodeResponse = ServerResponse | Http2ServerResponse;
