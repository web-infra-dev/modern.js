import {
  FormData as NodeFormData,
  Headers as NodeHeaders,
  Request as NodeRequest,
  Response as NodeResponse,
} from '@web-std/fetch';
import { Blob as NodeBlob, File as NodeFile } from '@web-std/file';
import {
  ReadableStream as NodeReadableStream,
  TransformStream as NodeTransformStream,
  WritableStream as NodeWritableStream,
} from '@web-std/stream';

/**
 * In the Response of @web-std/fetch, headers will be created
 * so we use defineProperty to add new properties，Instead of extend Headers in @web-std/fetch
 */
if (!Object.getOwnPropertyDescriptor(NodeHeaders.prototype, 'getSetCookie')) {
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
}

export const installGlobals = () => {
  if (!global.Headers) {
    global.Headers = NodeHeaders as typeof Headers;
  }

  if (!global.Request) {
    global.Request = NodeRequest as typeof Request;
  }

  if (!global.Response) {
    global.Response = NodeResponse as typeof Response;
  }

  if (!global.FormData) {
    global.FormData = NodeFormData;
  }

  if (!global.TransformStream) {
    global.TransformStream = NodeTransformStream;
  }

  if (!global.ReadableStream) {
    global.ReadableStream = NodeReadableStream;
  }

  if (!global.WritableStream) {
    global.WritableStream = NodeWritableStream;
  }

  if (!global.File) {
    global.File = NodeFile;
  }

  if (!global.Blob) {
    global.Blob = NodeBlob;
  }
};
