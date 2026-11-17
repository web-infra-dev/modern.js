import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { RouteView } from '../manifest';

interface RouteNode {
  path?: string;
  index?: boolean;
  component?: string;
  children?: RouteNode[];
}
/** Component-only subset of the framework's page/layout conventions. No Web runtime is injected. */
export async function collectComponentRoutes(
  root: string,
  include: string[] = ['/'],
) {
  const selected = (url: string) =>
    include.some(
      prefix =>
        prefix === '/' || url === prefix || url.startsWith(prefix + '/'),
    );
  const relevant = (url: string) =>
    selected(url) ||
    include.some(prefix => url === '/' || prefix.startsWith(url + '/'));
  const paths: string[] = [];
  const modules: string[] = [];
  async function moduleFile(filename: string) {
    const source = await fs.readFile(filename, 'utf8');
    if (
      /export\s*\*|export\s+(?:(?:async\s+)?function|const|let|class)\s+(?:loader|action|clientLoader|clientAction)\b|export\s*\{[^}]*\b(?:loader|action|clientLoader|clientAction)\b/s.test(
        source,
      )
    )
      throw new Error(
        `MCP component routes do not support route data exports: ${filename}`,
      );
    modules.push(filename);
    return filename;
  }
  async function walk(
    directory: string,
    segments: string[],
  ): Promise<RouteNode | undefined> {
    const url = '/' + segments.join('/');
    if (!relevant(url)) return undefined;
    const entries = (await fs.readdir(directory, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
    if (entries.some(entry => entry.isSymbolicLink()))
      throw new Error(
        `Symlinks are not supported in MCP route directories: ${directory}`,
      );
    if (
      entries.some(entry =>
        /^(?:page|layout)\.(?:loader|data|action)\.|^(?:loader|loading|error|config|route)\.[cm]?[jt]sx?$/.test(
          entry.name,
        ),
      )
    )
      throw new Error(
        `MCP component routes do not support loader/config/error modules: ${directory}`,
      );
    const find = (stem: string) => {
      const matches = entries.filter(
        entry =>
          entry.isFile() && new RegExp(`^${stem}\\.[jt]sx?$`).test(entry.name),
      );
      if (matches.length > 1)
        throw new Error(`Ambiguous MCP route module: ${directory}/${stem}`);
      return matches[0] && path.join(directory, matches[0].name);
    };
    const children: RouteNode[] = [];
    const page = find('page');
    if (page && selected(url)) {
      paths.push(url);
      children.push({ index: true, component: await moduleFile(page) });
    }
    const wildcard = find('\\$');
    if (wildcard && (selected(url) || segments.length === 0))
      children.push({ path: '*', component: await moduleFile(wildcard) });
    for (const entry of entries.filter(entry => entry.isDirectory())) {
      const segment = entry.name.replace(/^\[([A-Za-z_][\w]*)\]$/, ':$1');
      if (!relevant('/' + [...segments, segment].join('/'))) continue;
      if (!/^(?:[A-Za-z0-9_-]+|:[A-Za-z_][\w]*)$/.test(segment))
        throw new Error(`Unsupported MCP route segment: ${entry.name}`);
      const child = await walk(path.join(directory, entry.name), [
        ...segments,
        segment,
      ]);
      if (child) children.push({ ...child, path: segment });
    }
    if (!children.length) return undefined;
    const layout = find('layout');
    return {
      ...(layout ? { component: await moduleFile(layout) } : {}),
      children,
    };
  }
  const tree = await walk(root, []);
  if (!tree || !paths.length)
    throw new Error('No pages matched the MCP route selection');
  return { tree, paths, modules };
}
export async function writeRouteView(input: {
  root: string;
  configDirectory: string;
  view: RouteView;
  filename: string;
}) {
  const { root, configDirectory, view, filename } = input;
  const directory = await fs.realpath(
    path.resolve(configDirectory, view.routes),
  );
  if (!directory.startsWith((await fs.realpath(root)) + path.sep))
    throw new Error('MCP routes must be inside the application');
  const { tree, paths } = await collectComponentRoutes(directory, view.include);
  const home = view.home ?? '/';
  if (!paths.includes(home))
    throw new Error(`MCP home does not match a selected page: ${home}`);
  const appRequire = createRequire(path.join(root, 'package.json'));
  const imports: string[] = [];
  const render = (node: RouteNode): string => {
    let component = '';
    if (node.component) {
      const name = `Page${imports.length}`;
      imports.push(`import ${name} from ${JSON.stringify(node.component)};`);
      component = `Component: ${name},`;
    }
    return `{${component}${node.path ? `path:${JSON.stringify(node.path)},` : ''}${node.index ? 'index:true,' : ''}${node.children ? `children:[${node.children.map(render).join(',')}],` : ''}}`;
  };
  const routes = render(tree);
  const shell = view.shell
    ? `import Shell, * as shellModule from ${JSON.stringify(path.resolve(configDirectory, view.shell))}; export const mcpCapabilities = Reflect.get(shellModule, "mcpCapabilities");`
    : 'const Shell = ({children}) => children;';
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(
    filename,
    `import React from ${JSON.stringify(appRequire.resolve('react'))};
import { MemoryRouter, useRoutes } from ${JSON.stringify(appRequire.resolve('react-router'))};
${imports.join('\n')}
${shell}
const routes = [${routes}];
function Content() { return useRoutes(routes); }
export default function RoutedView(props) {
  const input = props.initialPath;
  const initialPath = typeof input === 'string' && /^\\/(?!\\/)/.test(input) && !/[\\\\#]/.test(input) && input !== '/' ? input : ${JSON.stringify(home)};
  return React.createElement(MemoryRouter, { key: initialPath, initialEntries: [initialPath] }, React.createElement(Shell, props, React.createElement(Content)));
}
`,
  );
  return filename;
}
