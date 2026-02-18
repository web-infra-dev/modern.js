import fs from 'node:fs';
import path from 'node:path';

describe('rsc-client-callback-bootstrap', () => {
  it('registers resolveActionId via runtime API', () => {
    const bootstrapFilePath = path.resolve(
      __dirname,
      '../src/runtime/rsc-client-callback-bootstrap.js',
    );
    const source = fs.readFileSync(bootstrapFilePath, 'utf-8');

    expect(source).toContain(
      "import { setResolveActionId } from '@modern-js/runtime/rsc/client';",
    );
    expect(source).toContain('setResolveActionId(resolveActionId);');
    expect(source).not.toContain('__MODERN_RSC_ACTION_RESOLVER__');
  });
});
