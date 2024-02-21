import {
  Request as NodeRequest,
  Response as NodeResponse,
  Headers as NodeHeaders,
} from '@web-std/fetch';
import {
  TransformStream as NodeTransformStream,
  ReadableStream as NodeReadableStream,
} from '@web-std/stream';

/**
 * In the Response of @web-std/fetch, headers will be created
 * so we use defineProperty to add new properties，Instead of extend Headers in @web-std/fetch
 */
Object.defineProperty(NodeHeaders.prototype, 'getSetCookie', {
  value: function getSetCookie() {
    const cookies: string[] = [];

    this.forEach((value: any, name: string) => {
      if (name.toLowerCase() === 'set-cookie') {
        cookies.push(value);
      }
    });

    return cookies;
  },
});

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
