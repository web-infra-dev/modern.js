import path from 'path';
import { rebaseDeclarationSpecifiers } from '../src/utils/clientGenerator';

describe('rebaseDeclarationSpecifiers', () => {
  const originDir = path.resolve('/app/dist/api/lambda/user');
  const clientDir = path.resolve('/app/dist/client/user');

  test('re-bases relative specifiers onto the copy location', () => {
    const source = [
      `import { load } from '../../../src/requests/service';`,
      `export * from './helper';`,
      `import fs = require('../shared');`,
      `export declare const get: () => Promise<import("../../../src/types").Data>;`,
    ].join('\n');

    const result = rebaseDeclarationSpecifiers(source, originDir, clientDir);

    expect(result).toContain(`from '../../src/requests/service'`);
    expect(result).toContain(`from '../../api/lambda/user/helper'`);
    expect(result).toContain(`require('../../api/lambda/shared')`);
    expect(result).toContain(`import("../../src/types")`);
  });

  test('leaves bare package specifiers untouched', () => {
    const source = [
      `import type { Foo } from '@scope/pkg';`,
      `import { z } from 'zod';`,
      `export declare const f: () => import("hono").Context;`,
    ].join('\n');

    expect(rebaseDeclarationSpecifiers(source, originDir, clientDir)).toBe(
      source,
    );
  });

  test('is a no-op when origin and target directories match', () => {
    const source = `import { a } from './sibling';\n`;

    expect(rebaseDeclarationSpecifiers(source, originDir, originDir)).toBe(
      source,
    );
  });
});
