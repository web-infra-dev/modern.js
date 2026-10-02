// Local mocks are only enabled during development.
// key: "METHOD /path" (GET by default); value: an object or a middleware.
type MockHandlers = Record<string, unknown>;

const handlers: MockHandlers = {
  'GET /bff-api': {
    message: 'Hello Modern.js from Mock',
    userid: 'mock-user',
  },
  'GET /mock/hello': { message: 'mock v3' },
  'GET /mock/fn': (_req: any, res: any) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'mock fn v1' }));
  },
};

export const config = {
  enable: process.env.BFF_MOCK === 'true',
};

export default handlers;
