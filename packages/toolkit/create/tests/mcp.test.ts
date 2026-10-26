import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const bin = path.resolve(__dirname, '../bin/run.js');
let workdir: string;
beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-mcp-create-'));
});
afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

it.each(['mcp-apps', 'mcp-apps-mf', 'mcp-server'])(
  'scaffolds %s with official SDK routes',
  variant => {
    const mf = variant === 'mcp-apps-mf';
    execFileSync(
      process.execPath,
      [
        bin,
        'app',
        '--template',
        mf ? 'mcp-apps' : variant,
        ...(mf ? ['--mf'] : []),
        '--no-agents-md',
      ],
      { cwd: workdir, encoding: 'utf8' },
    );
    const directory = path.join(workdir, 'app');
    const pkg = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
    );
    expect(pkg.dependencies['@modelcontextprotocol/server']).toBe('2.3.1');
    expect(pkg.devDependencies.typescript).toBe('~5.9.3');
    const route = fs.readFileSync(
      path.join(directory, 'api/lambda/mcp.ts'),
      'utf8',
    );
    expect(route).toContain('new McpServer(');
    expect(route).toContain('createBffHandlers(createServer)');
    expect(fs.existsSync(path.join(directory, 'mcp_apps.ts'))).toBe(false);
    expect(fs.existsSync(path.join(directory, 'mcp-views.json'))).toBe(
      variant !== 'mcp-server',
    );
    expect(
      fs.existsSync(path.join(directory, 'module-federation.config.ts')),
    ).toBe(mf);
    expect(
      JSON.parse(fs.readFileSync(path.join(directory, 'tsconfig.json'), 'utf8'))
        .include,
    ).toContain('api');
    if (variant !== 'mcp-server') {
      expect(
        fs.readFileSync(
          path.join(directory, 'src/components/Todos.tsx'),
          'utf8',
        ),
      ).toContain('McpViewProps');
      expect(pkg.devDependencies['@modern-js/plugin-mcp-apps']).toBeDefined();
    }
  },
);
it('supports template flags before the project name', () => {
  execFileSync(process.execPath, [bin, '--template=mcp-apps', 'app', '--sub'], {
    cwd: workdir,
    encoding: 'utf8',
  });
  expect(fs.existsSync(path.join(workdir, 'app/api/lambda/mcp.ts'))).toBe(true);
});
it('rejects MF without a UI template', () => {
  expect(() =>
    execFileSync(
      process.execPath,
      [bin, 'app', '--template', 'mcp-server', '--mf'],
      { cwd: workdir, stdio: 'pipe' },
    ),
  ).toThrow();
});
