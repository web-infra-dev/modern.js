import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fs } from '@modern-js/utils';
import {
  createSwcOptions,
  readCompilerOptions,
  registerSwc,
} from '../../src/utils/swcRegister';

describe('swcRegister', () => {
  let appDir: string;
  const write = (file: string, content: string) =>
    fs.outputFileSync(path.join(appDir, file), content);

  // Use Node's own require so modules go through `Module._extensions` and
  // share `require.cache` with the dev server, not the test runner's shim.
  let nodeRequire: NodeJS.Require;

  beforeAll(() => {
    // Use the real path: `require.cache` is keyed by it, and the tmp dir is a
    // symlink on macOS (/var -> /private/var).
    appDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'modern-swc-register-')),
    );
    write(
      'node_modules/@scope/tsconfig/base.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES2015',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      }),
    );
    write(
      'tsconfig.json',
      // json5 with comments, like real projects
      `{
        // shared base
        "extends": "@scope/tsconfig/base",
        "compilerOptions": { "jsx": "preserve" }
      }`,
    );
    nodeRequire = createRequire(path.join(appDir, 'index.js'));
    registerSwc({
      distDir: path.join(appDir, 'dist'),
      compilerOptions: readCompilerOptions(path.join(appDir, 'tsconfig.json')),
    });
  });

  afterAll(() => {
    fs.removeSync(appDir);
  });

  test('reads compiler options through extends', () => {
    expect(readCompilerOptions(path.join(appDir, 'tsconfig.json'))).toEqual({
      target: 'ES2015',
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      jsx: 'preserve',
    });
  });

  test('derives class field semantics from the target', () => {
    const transform = (target: string) =>
      createSwcOptions('a.ts', { target }).jsc?.transform
        ?.useDefineForClassFields;
    expect(transform('ES2015')).toBe(false);
    expect(transform('ES2022')).toBe(true);
    expect(transform('ESNext')).toBe(true);
    expect(
      createSwcOptions('a.ts', {
        target: 'ESNext',
        useDefineForClassFields: false,
      }).jsc?.transform?.useDefineForClassFields,
    ).toBe(false);
  });

  test('compiles syntax that native type stripping rejects', () => {
    write('src/types.ts', 'export interface User { id: string }\n');
    write(
      'src/syntax.ts',
      `import path from 'path';
import { User } from './types';
enum Color { Red, Blue }
namespace NS { export const value = 1; }
class Service { constructor(private name: string) {} get() { return this.name; } }
const user: User = { id: 'u' };
export const result = {
  color: Color.Blue,
  ns: NS.value,
  name: new Service('svc').get(),
  user: user.id,
  dir: path.basename(__dirname),
  hasRequire: typeof require,
};
`,
    );

    const { result } = nodeRequire(path.join(appDir, 'src/syntax'));
    expect(result).toEqual({
      color: 1,
      ns: 1,
      name: 'svc',
      user: 'u',
      dir: 'src',
      hasRequire: 'function',
    });
  });

  test('applies legacy decorators and decorator metadata from tsconfig', () => {
    const metadata: unknown[] = [];
    (Reflect as any).metadata = (key: string, value: unknown) => () => {
      metadata.push([key, value]);
    };
    write(
      'src/decorator.ts',
      `class Dep {}
const Injectable = (): ClassDecorator => () => {};
@Injectable()
export class Controller { constructor(public dep: Dep) {} }
`,
    );

    const { Controller } = nodeRequire(path.join(appDir, 'src/decorator.ts'));
    expect(typeof Controller).toBe('function');
    expect(metadata).toContainEqual([
      'design:paramtypes',
      [expect.any(Function)],
    ]);
    delete (Reflect as any).metadata;
  });

  test('reloads changed files after their require cache is cleared', () => {
    write('src/reload/dep.ts', "export const msg: string = 'dep-v1';\n");
    write(
      'src/reload/entry.ts',
      "import { msg } from './dep';\nexport default { tag: 'entry-v1', msg };\n",
    );
    const entry = path.join(appDir, 'src/reload/entry.ts');
    const dep = path.join(appDir, 'src/reload/dep.ts');

    expect(nodeRequire(entry).default).toEqual({
      tag: 'entry-v1',
      msg: 'dep-v1',
    });

    write('src/reload/dep.ts', "export const msg: string = 'dep-v2';\n");
    write(
      'src/reload/entry.ts',
      "import { msg } from './dep';\nexport default { tag: 'entry-v2', msg };\n",
    );
    delete nodeRequire.cache[dep];
    delete nodeRequire.cache[entry];

    expect(nodeRequire(entry).default).toEqual({
      tag: 'entry-v2',
      msg: 'dep-v2',
    });
  });
});
