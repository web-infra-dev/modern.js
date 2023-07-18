import path from 'path';
import enhancedResolve from 'enhanced-resolve';
import type { Resolver } from 'enhanced-resolve';
import fs from '@modern-js/utils/fs-extra';
import { createProcessor } from '@mdx-js/mdx';
import { Root } from 'hast';
import { MDX_REGEXP } from '@/shared/utils';

const { CachedInputFileSystem, ResolverFactory } = enhancedResolve;
const processor = createProcessor();
let resolver: Resolver;
let startFlatten = false;

export async function resolveDepPath(
  importPath: string,
  importer: string,
  alias: Record<string, string | string[]>,
) {
  if (!resolver) {
    resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs),
      extensions: ['.mdx', '.md', '.js'],
      alias,
    });
  }
  const resolveResult = await new Promise<string>((resolve, reject) => {
    resolver.resolve(
      {
        importer,
      },
      importer,
      importPath,
      {},
      (err, filePath) => {
        if (err) {
          return reject(err);
        }
        if (!filePath) {
          return reject(
            new Error(
              `Empty result when resolving ${importPath} from ${importer}`,
            ),
          );
        }
        return resolve(filePath);
      },
    );
  });
  return resolveResult;
}

export async function flattenMdxContent(
  content: string,
  basePath: string,
  alias: Record<string, string | string[]>,
): Promise<string> {
  let result = content;
  // We should update the resolver instanceof because the alias should be passed to it
  // If we reuse the resolver instance in `detectReactVersion` method, the resolver will lose the alias info and cannot resolve path correctly in mdx files.
  if (!startFlatten) {
    resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs),
      extensions: ['.mdx', '.md', '.js'],
      alias,
    });
    startFlatten = true;
  }
  let ast: Root;
  try {
    ast = processor.parse(content) as Root;
  } catch (e) {
    // Fallback: if mdx parse failed, just return the content
    return content;
  }
  const importNodes = ast.children
    .filter(node => node.type === 'mdxjsEsm')
    .map(node => {
      result = result.replace((node as { value: string }).value, '');
      return (node.data?.estree as any)?.body || [];
    })
    .flat()
    .filter(node => node.type === 'ImportDeclaration');

  for (const importNode of importNodes) {
    // import Comp from './a';
    // id: Comp
    // importPath: './a'
    const id = importNode.specifiers[0].local.name;
    const importPath = importNode.source.value;

    let absoluteImportPath: string;
    try {
      absoluteImportPath = await resolveDepPath(
        importPath,
        path.dirname(basePath),
        alias,
      );
    } catch (e) {
      continue;
    }
    if (MDX_REGEXP.test(absoluteImportPath)) {
      // replace import statement with the content of the imported file
      const importedContent = fs.readFileSync(absoluteImportPath, 'utf-8');
      const replacedValue = await flattenMdxContent(
        importedContent,
        absoluteImportPath,
        alias,
      );
      result = result.replace(new RegExp(`<${id}\\s*/>`), () => replacedValue);
    }
  }

  return result;
}
