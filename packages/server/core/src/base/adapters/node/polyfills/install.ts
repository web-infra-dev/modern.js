import {
  Request as NodeRequest,
  Response as NodeResponse,
  Headers as NodeHeaders,
} from '@web-std/fetch';
import {
  TransformStream as NodeTransformStream,
  ReadableStream as NodeReadableStream,
} from '@web-std/stream';

export const installGlobals = () => {
  if (!global.Headers) {
    global.Headers = NodeHeaders as unknown as typeof Headers;
  }

  if (!global.Request) {
    global.Request = NodeRequest as typeof Request;
  }

  if (!global.Response) {
    global.Response = NodeResponse as unknown as typeof Response;
  }

  if (!global.TransformStream) {
    global.TransformStream =
      NodeTransformStream as unknown as typeof TransformStream;
  }

  if (!global.ReadableStream) {
    global.ReadableStream =
      NodeReadableStream as unknown as typeof ReadableStream;
  }
};
