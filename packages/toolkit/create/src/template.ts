import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mcpAppsPackage from '../../mcp-apps/package.json';
import mcpPluginPackage from '../../../cli/plugin-mcp-apps/package.json';

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

/** Reuse the existing application template and select MCP-specific files. */
export function createProject(
  targetDir: string,
  options: {
    packageName: string;
    version: string;
    template: Template;
    mf: boolean;
    isSubproject: boolean;
    noAgentsMd: boolean;
  },
) {
  const { template, mf } = options;
  const isMcp = template !== 'app';
  const hasUi = template !== 'mcp-server';
  const data = {
    ...options,
    isMcp,
    hasUi,
    isMcpUi: template === 'mcp-apps',
    isMcpServer: template === 'mcp-server',
    mcpAppsVersion: mcpAppsPackage.version,
    mcpPluginVersion: mcpPluginPackage.version,
  };
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  copyTemplate(path.join(root, 'template'), targetDir, data);
  if (isMcp) {
    for (const directory of ['mcp', template, ...(mf ? ['mf'] : [])])
      copyTemplate(path.join(root, 'templates', directory), targetDir, data);
  }
}

function renderTemplate(
  template: string,
  data: Record<string, string | boolean>,
): string {
  let result = template;

  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (_match, condition, content) =>
    data[condition] ? content : '',
  );

  const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
  result = result.replace(unlessRegex, (match, condition, content) => {
    const value = data[condition];
    if (!value) {
      return content;
    }
    return '';
  });

  const varRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(varRegex, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : match;
  });

  return result;
}

function copyTemplate(
  src: string,
  dest: string,
  data: Record<string, string | boolean>,
) {
  fs.mkdirSync(dest, { recursive: true });

  const excludeInSubproject = [
    '.rstack',
    '.vscode',
    '.gitignore.handlebars',
    'rstack.config.mts',
    '.npmrc',
    '.nvmrc',
    // agent files are managed at the monorepo root in subproject setups
    'AGENTS.md',
  ];

  function copyRecursive(srcDir: string, destDir: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '.DS_Store') continue;
      if (data.isSubproject && excludeInSubproject.includes(entry.name)) {
        continue;
      }
      if (data.noAgentsMd && entry.name === 'AGENTS.md') {
        continue;
      }

      const relative = path
        .relative(src, path.join(srcDir, entry.name))
        .split(path.sep)
        .join('/');
      if (data.isMcp && path.basename(src) === 'template') {
        if (
          ['README.md', 'modern.config.ts', 'src/routes/page.tsx'].includes(
            relative,
          )
        )
          continue;
        if (!data.hasUi && relative === 'src') continue;
      }
      const srcPath = path.join(srcDir, entry.name);
      let destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        if (
          entry.name.endsWith('.handlebars') ||
          entry.name === 'tsconfig.json'
        ) {
          const templateContent = fs.readFileSync(srcPath, 'utf-8');
          let rendered = renderTemplate(templateContent, data);
          if (entry.name === 'tsconfig.json' && data.isMcp) {
            const config = JSON.parse(rendered);
            config.include = config.include.filter(
              (item: string) => data.hasUi || item !== 'src',
            );
            config.include.push(data.isMcpUi ? 'mcp_apps.ts' : 'api');
            if (data.mf) config.include.push('module-federation.config.ts');
            rendered = `${JSON.stringify(config, null, 2)}\n`;
          }
          destPath = destPath.replace(/\.handlebars$/, '');
          fs.writeFileSync(destPath, rendered, {
            encoding: 'utf-8',
            flag: 'wx',
          });
        } else {
          fs.copyFileSync(srcPath, destPath, fs.constants.COPYFILE_EXCL);
        }
      }
    }
  }

  copyRecursive(src, dest);
}
