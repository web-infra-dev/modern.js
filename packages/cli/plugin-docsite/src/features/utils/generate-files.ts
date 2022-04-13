import path from 'path';
import { logger, fs } from '@modern-js/utils';
import matter from 'gray-matter';
import {
  startCase,
  camelCase,
  union,
  template,
  difference,
} from '@modern-js/utils/lodash';
import GithubSlugger from 'github-slugger';
import sortPaths from 'sort-paths';
import visit from 'unist-util-visit';
import toString from 'mdast-util-to-string';
import u from 'unist-builder';
import mdx from '@mdx-js/mdx';
import babelParser, { ParserOptions } from '@babel/parser';
import {
  DOCS_RENDER_PATH,
  MDX_DEFAULT_RENDERER,
  UTILS_STATIC,
} from '../constant';

const loadTemplate = async (file: string, customPath = false) => {
  let result = '';
  if (customPath) {
    result = await fs.readFile(file, 'utf-8');
  } else {
    result = await fs.readFile(path.join(UTILS_STATIC, file), 'utf-8');
  }

  return template(result, { interpolate: /<%=([\s\S]+?)%>/g });
};

interface Node {
  value?: string;
  type: string;
  depth?: number;
  url?: string;
  data?: {
    hProperties: {
      id: string;
    };
  };
  children?: Node[];
}

async function handleFile(
  appDirectory: string,
  tmpDir: string,
  file: string,
  images: string[],
) {
  const moduleName = file.replace(/\.(md|mdx)$/, '');
  const content = await fs.readFile(path.resolve(appDirectory, 'docs', file));
  const parsed = matter(content);
  if (!parsed.data.title) {
    parsed.data.title = startCase(camelCase(path.basename(moduleName)));
  }

  const slugger = new GithubSlugger();
  slugger.reset();

  const babelOptions: ParserOptions = {
    allowUndeclaredExports: true,
    sourceType: 'module',
  };
  const imported: { id: string; node: any }[] = [];
  const exported: { id: string; node: any }[] = [];
  const toc: { slug: string; text: string }[] = [];

  const modifier = () => (tree: any) => {
    visit<Node>(tree, 'import', node => {
      const parsedNode = babelParser.parse(node.value!, babelOptions);
      const nodes = parsedNode.program.body;
      nodes.forEach((n: any) => {
        if (n.type === 'ImportDeclaration') {
          n.specifiers.forEach((sp: any) => {
            imported.push({
              id: sp.local.name,
              node,
            });
          });
        }
      });
    });
    visit<Node>(tree, 'export', node => {
      const parsedNode = babelParser.parse(node.value!, babelOptions);
      const nodes = parsedNode.program.body;
      nodes.forEach((n: any) => {
        if (n.type === 'ExportNamedDeclaration') {
          n.specifiers.forEach((sp: any) => {
            exported.push({
              id: sp.exported.name,
              node,
            });
          });
        }
      });
    });
    const extraImported = difference(
      imported.map(n => n.id),
      exported.map(n => n.id),
    );
    // we have to put the export statement with the import,
    // otherwise the mdx's babel transformer cannot found
    // the corresponding imports
    extraImported.forEach(id => {
      const { node } = imported.find(n => n.id === id)!;
      node.value += `\nexport { ${id} };`;
    });
    visit<Node>(tree, 'heading', node => {
      if (node.depth === 2) {
        const slug = slugger.slug(toString(node));
        node.data = { hProperties: { id: slug } };
        toc.push({
          slug,
          text: toString(node),
        });
      }
    });
    visit<Node>(tree, 'root', node => {
      (node.children || []).unshift(
        u('heading', {
          depth: 1,
          children: [u('text', { value: parsed.data.title })],
        }),
      );
    });
    visit<Node>(tree, 'image', node => {
      const { url } = node;
      if (!url!.startsWith('http')) {
        const fullPath = path.resolve(
          path.dirname(path.resolve(appDirectory, 'docs', file)),
          url!,
        );
        const relativePath = path.relative(
          path.resolve(appDirectory, 'assets'),
          fullPath,
        );
        if (relativePath.startsWith('..')) {
          logger.warn(
            `${url!} referenced in ${file} is not under the "assets" folder`,
          );
        } else {
          images.push(relativePath);
          node.url = `/${path.relative(
            path.dirname(path.resolve(appDirectory, 'docs', file)),
            path.resolve(appDirectory, 'docs/assets', relativePath),
          )}`;
        }
      }
    });
  };

  const transpiled = await mdx(parsed.content, { remarkPlugins: [modifier] });
  const totalExported = union(
    imported.map(n => n.id),
    exported.map(n => n.id),
  );
  const outputFile = path.resolve(tmpDir, `${moduleName}/mdx.jsx`);
  await fs.outputFile(outputFile, MDX_DEFAULT_RENDERER + transpiled, {
    encoding: 'utf8',
  });

  const pageFile = path.resolve(tmpDir, `${moduleName}/index.jsx`);
  const pageTemplate = await loadTemplate('docs-page.jsx.tpl');
  const pageContent = pageTemplate({
    moduleName,
    toc: JSON.stringify(toc),
    relRoot: path.relative(path.dirname(outputFile), tmpDir),
    imports: totalExported.length
      ? `import { ${totalExported.join(', ')} } from './mdx';`
      : '',
    imported: totalExported.join(','),
  });
  await fs.outputFile(pageFile, pageContent, { encoding: 'utf8' });
  return {
    ...parsed.data,
    moduleName,
    pageFile,
  };
}
export async function generateFiles(
  appDirectory: string,
  tmpDir: string,
  files: string[],
  isDev: boolean,
) {
  await fs.remove(tmpDir);
  await fs.ensureDir(tmpDir);
  const images: string[] = [];

  const meta = await Promise.all(
    files.map(file => handleFile(appDirectory, tmpDir, file, images)),
  );
  const sorted: { moduleName: string; title: string }[] = sortPaths(
    meta,
    (e: { moduleName: string; title: string }) =>
      e.moduleName.endsWith('index')
        ? e.moduleName.replace(/index$/, '')
        : `${e.moduleName}/`,
    '/',
  );
  const routesTemplate = await loadTemplate('DocsRoutes.jsx.tpl');
  await fs.outputFile(
    path.resolve(tmpDir, 'DocsRoutes.jsx'),
    routesTemplate({ meta: sorted }),
  );
  const pkgInfo = await fs.readJson(path.resolve(appDirectory, 'package.json'));
  const entryTemplate = await loadTemplate('docs-entry.jsx.tpl');
  await fs.outputFile(
    path.resolve(tmpDir, 'docs-entry.jsx'),
    entryTemplate({
      basename: isDev
        ? '/'
        : `${DOCS_RENDER_PATH}/${pkgInfo.name}/${pkgInfo.version}`,
    }),
  );
  await Promise.all(
    ['DocsNav.jsx.tpl', 'DocsToc.jsx.tpl', 'docs.css'].map(async file =>
      fs.copyFile(
        path.resolve(UTILS_STATIC, file),
        path.resolve(tmpDir, file.replace('.tpl', '')),
      ),
    ),
  );
  await fs.outputJson(
    path.resolve(tmpDir, 'meta.json'),
    sorted.map(({ title, moduleName }) => ({ title, moduleName })),
    { spaces: 2 },
  );
  await fs.ensureDir(path.resolve(appDirectory, 'dist/docs/assets'));
  await Promise.all(
    Array.from(new Set(images)).map(file =>
      fs.copyFile(
        path.resolve(appDirectory, 'assets', file),
        path.resolve(appDirectory, 'dist/docs/assets', file),
      ),
    ),
  );
  return sorted;
}
