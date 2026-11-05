import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

test('preserves public JavaScript and declaration entry points', () => {
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    assert.ok(existsSync(resolve(root, entry.default)), entry.default);
    assert.ok(existsSync(resolve(root, entry.types)), entry.types);
    const result = ts.resolveModuleName(
      `${pkg.name}/${subpath.slice(2)}`,
      resolve(root, 'tests/consumer.ts'),
      { moduleResolution: ts.ModuleResolutionKind.Bundler },
      ts.sys,
    );
    assert.equal(
      result.resolvedModule?.resolvedFileName,
      resolve(root, entry.types),
    );
  }
});

for (const [format, extension] of [
  ['esm', '.js'],
  ['esm-node', '.mjs'],
  ['cjs', '.js'],
]) {
  test(`${format} preserves application RSC globals and module references`, () => {
    const dist = resolve(root, 'dist', format);
    for (const entry of ['server/rsc/csr', 'server/ssr/ssr']) {
      const code = readFileSync(resolve(dist, `${entry}${extension}`), 'utf8');
      assert.match(code, /__rspack_rsc_manifest__\?\.entryCssFiles/);
      assert.doesNotMatch(code, /RSPACK_RSC_MANIFEST|\.rscM\b/);
    }
    const rsc = readFileSync(
      resolve(dist, `server/rsc/rsc${extension}`),
      'utf8',
    );
    assert.match(rsc, /react-server-dom-rspack\/server\.node/);
    assert.match(rsc, /loadServerAction/);
    for (const file of readdirSync(dist, { recursive: true })) {
      if (!file.endsWith(extension)) continue;
      const filename = resolve(dist, file);
      const code = readFileSync(filename, 'utf8');
      for (const { fileName } of ts.preProcessFile(code, true, true)
        .importedFiles) {
        if (fileName.startsWith('.')) {
          assert.ok(
            existsSync(resolve(dirname(filename), fileName)),
            `${file}: ${fileName}`,
          );
        }
      }
    }
  });
}

test('built CSR renderer uses the application manifest to inject CSS and Flight data', async () => {
  const nativeRequire = createRequire(import.meta.url);
  const cache = new Map();
  const element = { message: 'server component' };
  const renderToReadableStream = value => {
    assert.equal(value, element);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('flight-payload'));
        controller.close();
      },
    });
  };
  const load = filename => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    runInNewContext(
      readFileSync(filename, 'utf8'),
      {
        module,
        exports: module.exports,
        require: request => {
          if (request === 'react-server-dom-rspack/server.node') {
            return { renderToReadableStream };
          }
          if (request === 'react-server-dom-rspack/client.node') return {};
          return request.startsWith('.')
            ? load(resolve(dirname(filename), request))
            : nativeRequire(request);
        },
        __rspack_rsc_manifest__: { entryCssFiles: { index: ['/app.css'] } },
        ReadableStream,
        TransformStream,
        TextEncoder,
        TextDecoder,
        Response,
        Headers,
        setTimeout,
        clearTimeout,
      },
      { filename },
    );
    return module.exports;
  };
  const { renderCSRWithRSC } = load(
    resolve(root, 'dist/cjs/server/rsc/csr.js'),
  );
  const response = await renderCSRWithRSC({
    html: '<html><head></head><body><div id="root"></div></body></html>',
    rscRoot: element,
  });
  const html = await response.text();
  assert.match(html, /<link href="\/app.css" rel="stylesheet" \/><\/head>/);
  assert.match(html, /__FLIGHT_DATA/);
  assert.match(html, /flight-payload/);
  assert.ok(html.endsWith('</body></html>'));
});
