import { init, parse, ImportSpecifier } from 'es-module-lexer';
import stripComments from 'strip-comments';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
init;

const REPLACE_IMPORT_REG = /\s*(['"])(.*)\1\s*$/m;

export async function transformEsmImports(
  _code: string,
  replaceImport: (specifier: string) => Promise<string>,
) {
  const imports = await scanCodeImportsExports(_code);
  let rewrittenCode = _code;
  for (const imp of imports.reverse()) {
    // 处理 import type，直接删掉
    if (rewrittenCode.substring(imp.ss, imp.se).indexOf('import type') !== -1) {
      rewrittenCode = spliceString(rewrittenCode, '', imp.ss, imp.se);
      continue;
    }

    let spec = rewrittenCode.substring(imp.s, imp.e);
    if (!spec.startsWith('http')) {
      spec = stripComments(spec);
    }
    if (imp.d > -1) {
      const importSpecifierMatch = spec.match(REPLACE_IMPORT_REG);
      spec = importSpecifierMatch![2];
    }
    let rewrittenImport = await replaceImport(spec);
    if (imp.d > -1) {
      rewrittenImport = JSON.stringify(rewrittenImport);
    }
    rewrittenCode = spliceString(rewrittenCode, rewrittenImport, imp.s, imp.e);
  }
  return rewrittenCode;
}
export async function scanCodeImportsExports(
  code: string,
): Promise<ImportSpecifier[]> {
  // CHENG: code might not be parsed
  let imports: ImportSpecifier[] = [];
  try {
    [imports] = parse(code);
  } catch (e) {
    // no-catch
  }
  return imports.filter((imp: any) => {
    // imp.d = -2 = import.meta.url = we can skip this for now
    if (imp.d === -2) {
      return false;
    }
    // imp.d > -1 === dynamic import
    if (imp.d > -1) {
      const importStatement = stripComments(code.substring(imp.s, imp.e));
      const importSpecifierMatch = importStatement.match(REPLACE_IMPORT_REG);
      return Boolean(importSpecifierMatch);
    }
    return true;
  });
}

function spliceString(
  source: string,
  withSlice: string,
  start: number,
  end: number,
) {
  // String.raw preserves backward slash in windows
  return (
    source.slice(0, start) + String.raw`${withSlice || ''}` + source.slice(end)
  );
}
