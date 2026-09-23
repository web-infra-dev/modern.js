import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Template = 'app' | 'mcp-apps' | 'mcp-server';

export function parseTemplate(args: string[]): Template {
  const values: string[] = [];
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--template') values.push(args[++index] ?? '');
    else if (args[index].startsWith('--template='))
      values.push(args[index].slice('--template='.length));
  }
  if (
    values.length > 1 ||
    (values.length && !['app', 'mcp-apps', 'mcp-server'].includes(values[0]))
  ) {
    throw new Error('--template must be one of: app, mcp-apps, mcp-server');
  }
  return (values[0] ?? 'app') as Template;
}

export function applyMcpTemplate(
  targetDir: string,
  version: string,
  template: Exclude<Template, 'app'>,
  mf = false,
) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../mcp-templates',
  );
  fs.cpSync(path.join(root, 'shared'), targetDir, { recursive: true });
  fs.cpSync(path.join(root, template), targetDir, { recursive: true });
  if (mf)
    fs.cpSync(path.join(root, 'mcp-apps-mf'), targetDir, { recursive: true });
  const pkgPath = path.join(targetDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies['@modern-js/mcp-apps'] = version;
  // BFF owns the HTTP endpoint; MCP Apps owns compilation and tool execution.
  pkg.dependencies['@modern-js/plugin-mcp-apps'] = version;
  pkg.dependencies['@modern-js/plugin-bff'] = version;
  // Use BFF's supported TS runtime on Node 20+ and invalidate API modules on reload.
  pkg.devDependencies['ts-node'] = '^10.9.2';
  pkg.scripts.deploy = 'modern deploy';
  if (template === 'mcp-apps') {
    if (mf) pkg.dependencies['@modern-js/server-runtime'] = version;
    if (mf) pkg.devDependencies['@module-federation/modern-js-v3'] = '2.0.0';
  } else {
    fs.rmSync(path.join(targetDir, 'src'), { recursive: true, force: true });
    delete pkg.dependencies['@modern-js/runtime'];
    delete pkg.dependencies.react;
    delete pkg.dependencies['react-dom'];
    delete pkg.devDependencies['@types/react'];
    delete pkg.devDependencies['@types/react-dom'];
  }
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  const tsPath = path.join(targetDir, 'tsconfig.json');
  const ts = JSON.parse(fs.readFileSync(tsPath, 'utf8'));
  ts.include.push('api', 'mcp', 'mcp_apps.ts');
  if (mf) ts.include.push('module-federation.config.ts');
  fs.writeFileSync(tsPath, `${JSON.stringify(ts, null, 2)}\n`);
}
