// 本地 mock（仅 dev 生效）。用户常用 .ts 编写。
// key: "METHOD /path"（省略 method 默认 GET）；value: 对象(直接 JSON) 或 函数(中间件)。
type MockHandlers = Record<string, unknown>;

const handlers: MockHandlers = {
  'GET /mock/hello': { message: 'mock v3' },
  'GET /mock/fn': (_req: any, res: any) => {
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'mock fn v1' }));
  },
};

export default handlers;
