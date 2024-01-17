import {
  Request as NodeRequest,
  Response as NodeResponse,
  Headers as NodeHeaders,
} from '@web-std/fetch';

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
};
