import { Console } from 'console';
import { readFileSync } from 'fs';
import Module, { register } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';
import { expect } from '@rstest/core';
import { createSnapshotSerializer } from 'path-serializer';

global.console.Console = Console;

// Some tests load a `.ts` file at runtime (BFF api handlers / mock config are
// read on demand, not statically imported by the test) — via `require()`
// (CJS) or `await import()` (ESM). Node only strips TypeScript types on those
// from v22.18 onward; on older versions they throw "Unexpected token" /
// "Unknown file extension", failing those tests. Install fallbacks that use
// Node's own type-stripper: a require hook for `require`, and an ESM loader for
// `import`. Both are gated on `process.features.typescript`, so on Node >= 22.18
// (and CI) this whole block is a no-op — Node already handles `.ts` natively.
const nodeModule = Module as unknown as {
  _extensions: Record<string, (m: any, filename: string) => void>;
  stripTypeScriptTypes?: (code: string, options?: { mode?: string }) => string;
};
if (
  !process.features.typescript &&
  typeof nodeModule.stripTypeScriptTypes === 'function'
) {
  if (!nodeModule._extensions['.ts']) {
    nodeModule._extensions['.ts'] = (m, filename) => {
      const source = readFileSync(filename, 'utf8');
      const js = nodeModule.stripTypeScriptTypes!(source, {
        mode: 'transform',
      });
      (
        m as unknown as { _compile: (code: string, fn: string) => void }
      )._compile(js, filename);
    };
  }
  const registered = globalThis as unknown as { __tsStripLoader?: boolean };
  if (!registered.__tsStripLoader) {
    register(pathToFileURL(path.join(__dirname, 'ts-strip-loader.mjs')).href);
    registered.__tsStripLoader = true;
  }
}

// Disable chalk in test
process.env.FORCE_COLOR = '0';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    workspace: path.join(__dirname, '..', '..'),
    replace: [
      {
        mark: 'fragment',
        match: /(?<=\/)modern-js\/stub-builder\/[^/]+\/[^/]+/,
      },
    ],
  }),
);
