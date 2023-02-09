import path from 'path';
import enhancedResolve from 'enhanced-resolve';
import type { Resolver } from 'enhanced-resolve';
import fs from '@modern-js/utils/fs-extra';
import { createProcessor } from '@mdx-js/mdx';
import { Root } from 'hast';
import { MDX_REGEXP } from '@/shared/utils';

const { CachedInputFileSystem, ResolverFactory } = enhancedResolve;
export const IMPORT_FROM_REGEX = /import\s+(.*)from\s+['"](.*)['"];?/;
let resolver: Resolver;
const processor = createProcessor();

export async function resolveDepPath(
  importPath: string,
  importer: string,
  alias: Record<string, string | string[]>,
) {
  if (!resolver) {
    resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs),
      extensions: ['.mdx', '.md'],
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
  let ast: Root;
  try {
    ast = processor.parse(content) as Root;
  } catch (e) {
    // Fallback: if mdx parse failed, just return the content
    return content;
  }
  const importNodes = ast.children.filter(node => node.type === 'mdxjsEsm');
  for (const importNode of importNodes) {
    const importStatement = (importNode as { value: string }).value;
    const match = importStatement.match(IMPORT_FROM_REGEX);
    if (!match) {
      continue;
    }
    const [rawImportStatement, id, importPath] = match;

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
      const importedContent = await fs.readFile(absoluteImportPath, 'utf-8');
      result = result
        .replace(rawImportStatement, '')
        .replace(
          new RegExp(`<${id}\\s*/>`),
          await flattenMdxContent(importedContent, absoluteImportPath, alias),
        );
    }
  }
  return result;
}
