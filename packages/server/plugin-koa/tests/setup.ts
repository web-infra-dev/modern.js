import { IncomingMessage, ServerResponse } from 'node:http';

jest.mock('@modern-js/server-core/node', () => {
  const originalModule = jest.requireActual('@modern-js/server-core/node');

  return {
    ...originalModule,
    httpCallBack2HonoMid: jest.fn().mockImplementation(handler => {
      return async (req: IncomingMessage, res: ServerResponse) => {
        // @ts-expect-error
        req.__honoRequest = req;
        await handler(req, res);
      };
    }),
  };
});
