// T08 (L3/code, http_check): BFF enabled + GET /api/hello returns {"message":"hi"}.
// Behavioral final word: build, then serve on a random port and hit the API.
export default async function grade(ctx, c) {
  const conf = ctx.stripComments(
    ctx.read('modern.config.ts') ?? ctx.read('modern.config.js'),
  );
  const okPlugin = c.add(
    'bff-plugin-registered',
    conf && /@modern-js\/plugin-bff/.test(conf) && /bffPlugin\s*\(/.test(conf),
    'modern.config must import and register bffPlugin() from @modern-js/plugin-bff',
  );
  const apiRel = [
    'api/lambda/hello.ts',
    'api/lambda/hello.js',
    'api/lambda/hello/index.ts',
  ].find(p => ctx.exists(p));
  const okApi = c.add(
    'api-hello-exists',
    !!apiRel,
    'api/lambda/hello.ts missing',
  );
  let okGet = false;
  if (okApi) {
    const api = ctx.stripComments(ctx.read(apiRel));
    okGet = c.add(
      'api-hello-get-export',
      /export\s+(const|let|var|async\s+function|function)\s+get\b/i.test(api) ||
        /export\s+default/.test(api),
      'hello.ts must export a GET handler (export const get / export default)',
    );
  }
  if (!(okPlugin && okApi && okGet)) return;

  const b = await ctx.build();
  if (
    !c.add(
      'build',
      b.ok,
      b.ok
        ? ''
        : `pnpm build exit ${b.code}${b.timedOut ? ' (timeout)' : ''}: ${b.tail.slice(-300)}`,
    )
  )
    return;

  await ctx.withServer(async srv => {
    if (
      !c.add(
        'serve-ready',
        srv.ready,
        srv.ready
          ? `port=${srv.port}`
          : `server not ready in 30s: ${srv.log()}`,
      )
    )
      return;
    let res;
    try {
      res = await srv.get('/api/hello');
    } catch (e) {
      c.add('http-api-hello', false, `GET /api/hello failed: ${e.message}`);
      return;
    }
    if (
      !c.add(
        'http-status-200',
        res.status === 200,
        `GET /api/hello → ${res.status}`,
      )
    )
      return;
    let body;
    try {
      body = JSON.parse(res.text);
    } catch {
      c.add(
        'http-json-body',
        false,
        `body is not JSON: ${res.text.slice(0, 120)}`,
      );
      return;
    }
    const keys = body && typeof body === 'object' ? Object.keys(body) : [];
    c.add(
      'http-json-body',
      keys.length === 1 && body.message === 'hi',
      `expected {"message":"hi"}, got ${res.text.slice(0, 120)}`,
    );
  });
}
