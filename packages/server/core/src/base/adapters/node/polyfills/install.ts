import {
  Request as NodeRequest,
  Response as NodeResponse,
  Headers as NodeHeaders,
  FormData as NodeFormData,
} from '@web-std/fetch';
import {
  TransformStream as NodeTransformStream,
  ReadableStream as NodeReadableStream,
  WritableStream as NodeWritableStream,
} from '@web-std/stream';
import { File as NodeFile, Blob as NodeBlob } from '@web-std/file';

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
