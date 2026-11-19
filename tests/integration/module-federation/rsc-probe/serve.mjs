import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const root = import.meta.dirname;
const baseline =
  process.env.MF_RSC_BASELINE || path.resolve(root, '../../../..');
const require = createRequire(import.meta.url);
const bridgeRequire = createRequire(
  path.join(baseline, 'packages/cli/plugin-module-federation/package.json'),
);
const { createBridgeServiceHandler } = bridgeRequire(
  '@module-federation/bridge-react/service-node',
);
const stylesheetFiles = Object.fromEntries(
  await Promise.all(
    ['v1', 'v2'].map(async version => [
      version,
      (
        await readdir(path.join(root, 'dist', version, 'client'), {
          recursive: true,
        })
      ).filter(file => file.endsWith('.css')),
    ]),
  ),
);
const handlers = Object.fromEntries(
  ['v1', 'v2'].map(version => [
    version,
    createBridgeServiceHandler({
      buildVersion: `rsc-probe-${version}`,
      async render(info) {
        const result = await require(
          `./dist/${version}/server/index.js`,
        ).renderService({
          ...info,
          reportEndpoint: new URL(
            '/climate-report',
            process.env.MF_LAB_API_ORIGIN,
          ).href,
        });
        return {
          ...result,
          stylesheets: stylesheetFiles[version].map(
            file => new URL(`/${version}/${file}`, info.url).href,
          ),
        };
      },
    }),
  ]),
);
createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/service/')) {
      const handler = handlers[pathname.split('/')[2]];
      if (!handler) {
        res.writeHead(404).end();
        return;
      }
      const body = await new Response(req).arrayBuffer();
      const response = await handler(
        new Request('http://localhost' + pathname, {
          method: 'POST',
          headers: req.headers,
          body,
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      for await (const chunk of response.body) res.write(chunk);
      res.end();
    } else if (pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end(`<style>html,body{margin:0;background:#f4f8fc;font-family:Arial,sans-serif}</style><button id="load">Load RSC services</button><button id="unmount">Unmount</button><div id="one"></div><div id="two"></div><div id="three"></div><pre id="error"></pre>
${(await readFile(path.join(root, 'dist/v1/client/index.html'), 'utf8')).match(/<script[^>]*src="[^"]+"[^>]*><\/script>/g).join('')}`);
    } else {
      const [, version, ...parts] = pathname.split('/');
      if (!handlers[version]) {
        res.writeHead(404).end();
        return;
      }
      const assets = path.join(root, 'dist', version, 'client');
      const file = path.resolve(assets, ...parts);
      if (!file.startsWith(assets + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      res.setHeader(
        'Content-Type',
        pathname.endsWith('.js')
          ? 'text/javascript'
          : pathname.endsWith('.css')
            ? 'text/css'
            : 'application/json',
      );
      res.end(await readFile(file));
    }
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(
  Number(process.env.MF_RSC_PORT || process.env.JO_PORT_HOST),
  process.env.MF_LAB_PUBLIC_HOST || '127.0.0.1',
  () => console.log('RSC probe listening', process.env.JO_PORT_HOST),
);
