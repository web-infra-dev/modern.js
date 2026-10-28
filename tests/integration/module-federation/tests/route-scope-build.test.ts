import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  symlink,
  rm,
  readdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const execute = promisify(execFile);
const providerRequire = createRequire(
  path.resolve(__dirname, '../provider/package.json'),
);
const appTools = providerRequire.resolve('@modern-js/app-tools');
const modern = path.resolve(path.dirname(appTools), '../../bin/modern.js');
const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true })),
  );
});

async function build(
  argument: string,
  options: { configRoutes?: boolean; multiEntry?: boolean; app?: boolean } = {},
) {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-route-build-'));
  directories.push(directory);
  const put = async (name: string, content: string) => {
    const filename = path.join(directory, name);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, content);
  };
  await put(
    'package.json',
    JSON.stringify({
      name: 'modern-route-build',
      private: true,
      dependencies: {
        '@modern-js/runtime': '3.10.1',
        react: '19.3.1',
        'react-dom': '19.3.1',
      },
    }),
  );
  for (const name of [
    '@modern-js/runtime',
    '@modern-js/app-tools',
    '@module-federation/enhanced',
    'react',
    'react-dom',
    'typescript',
    '@types/react',
    '@types/react-dom',
    '@types/node',
  ]) {
    let root = path.dirname(
      providerRequire.resolve(
        name.startsWith('@types/') ? `${name}/package.json` : name,
      ),
    );
    while (
      JSON.parse(
        await readFile(path.join(root, 'package.json'), 'utf8').catch(
          () => '{}',
        ),
      ).name !== name
    ) {
      const parent = path.dirname(root);
      if (parent === root)
        throw new Error(`Cannot resolve fixture dependency ${name}`);
      root = parent;
    }
    const target = path.join(directory, 'node_modules', name);
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(root, target, 'dir');
  }
  await put(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        skipLibCheck: true,
        noEmit: true,
      },
      include: ['src', '*.ts'],
      exclude: ['node_modules', 'dist'],
    }),
  );
  await put(
    'src/routes/layout.tsx',
    "import { Outlet } from '@modern-js/runtime/router'; export default function Layout() { return <Outlet /> }",
  );
  await put(
    'src/routes/product/page.tsx',
    'export default () => <p>PRODUCT_ONLY</p>',
  );
  await put(
    'src/routes/product/detail/[id]/page.tsx',
    'export default () => <p>DYNAMIC_CHILD</p>',
  );
  await put(
    'src/routes/orders/page.tsx',
    'export default () => <p>ORDERS_ONLY</p>',
  );
  if (options.app) {
    await rm(path.join(directory, 'src/routes'), { recursive: true });
    await put(
      'src/App.tsx',
      'export default () => <p>COMPONENT_APPLICATION</p>',
    );
  }
  if (options.configRoutes)
    await put(
      'src/modern.routes.ts',
      "import { defineRoutes } from '@modern-js/runtime/config-routes'; export default defineRoutes(({layout, page}) => [layout('./routes/layout.tsx', '/', [page('./routes/product/page.tsx', 'product'), page('./routes/orders/page.tsx', 'product')])])",
    );
  if (options.multiEntry) {
    await put(
      'src/admin/routes/layout.tsx',
      "import { Outlet } from '@modern-js/runtime/router'; export default () => <Outlet />",
    );
    await put(
      'src/admin/routes/page.tsx',
      'export default () => <p>ADMIN_ONLY</p>',
    );
  }
  await put(
    'src/export.tsx',
    `import '@modern-js/runtime/registry/${options.multiEntry ? 'admin' : 'index'}';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent } from '@modern-js/runtime/mf';
const Root = createRoot(${argument});
export default createBridgeComponent({ rootComponent: Root });`,
  );
  await put(
    'modern.config.ts',
    `import { appTools, defineConfig } from '@modern-js/app-tools'; export default defineConfig({
${options.multiEntry ? "source: {disableDefaultEntries: true, entries: {index: './src/routes', admin: './src/admin/routes'}}," : ''}
plugins: [appTools()], moduleFederation: { config: { name: 'route_build', dts: false, exposes: {'./App': './src/export.tsx'}, shared: {react: {singleton: true, requiredVersion: false}, 'react-dom': {singleton: true, requiredVersion: false}} } } })`,
  );
  try {
    const result = await execute(process.execPath, [modern, 'build'], {
      cwd: directory,
      env: { ...process.env, NODE_ENV: 'production', NODE_PATH: '' },
      timeout: 60000,
      maxBuffer: 2 * 1024 * 1024,
    });
    return { code: 0, output: result.stdout + result.stderr, directory };
  } catch (error) {
    const failure = error as { code: number; stdout: string; stderr: string };
    return {
      code: failure.code,
      output: failure.stdout + failure.stderr,
      directory,
    };
  }
}

describe('Modern producer build diagnostics', () => {
  it.each([
    ["{route: '/product/detail/:id'}", 'dynamic parameters'],
    ["{route: '/missing'}", 'does not exist'],
    ["{route: String('/product')}", 'statically known'],
  ])('fails the real build for %s', async (argument, message) => {
    const result = await build(argument);
    expect(result.code, result.output).not.toBe(0);
    expect(result.output).toContain('[Modern.js Module Federation]');
    expect(result.output).toContain(message);
    expect(result.output).toContain('export.tsx');
  });
  it('diagnoses independent same-path configured branches', async () => {
    const result = await build("{route: '/product'}", { configRoutes: true });
    expect(result.code, result.output).not.toBe(0);
    expect(result.output).toContain('ambiguous');
  });
  it('binds a whole-application export to its explicitly imported secondary registry', async () => {
    const result = await build('', { multiEntry: true });
    expect(result.code, result.output).toBe(0);
    const scopes = path.join(
      result.directory,
      'node_modules/.modern-js/admin/mf-scopes',
    );
    const [scope] = await readdir(scopes);
    const routes = await readFile(
      path.join(scopes, scope, 'routes.js'),
      'utf8',
    );
    expect(routes).toContain('admin/routes/page');
    expect(routes).not.toContain('routes/product');
  });
  it('keeps whole-application App component entries compatible and rejects a route without a graph', async () => {
    const whole = await build('', { app: true });
    expect(whole.code, whole.output).toBe(0);
    const scoped = await build("{route: '/product'}", { app: true });
    expect(scoped.code, scoped.output).not.toBe(0);
    expect(scoped.output).toContain('does not exist');
  });
});
