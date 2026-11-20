#!/usr/bin/env node
// The bridge implementation lives in the compiled ESM output; a CommonJS shim
// keeps the shebang and runs directly on Node >=20 without any loader.
import('../dist/esm-node/stdio.mjs').then(
  m => m.runStdioBridgeCli(),
  err => {
    process.stderr.write(
      `[modern-mcp-stdio] ${err instanceof Error ? err.stack || err.message : String(err)}\n`,
    );
    process.exitCode = 1;
  },
);
