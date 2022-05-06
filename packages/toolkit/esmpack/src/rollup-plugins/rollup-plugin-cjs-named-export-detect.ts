import path from 'path';
import { fs } from '@modern-js/utils';
import { isPlainObject } from '@modern-js/utils/lodash';
import type { Plugin } from 'rollup';
import { init, parse } from 'es-module-lexer';
import {
  parseExportVariableNamesFromCJSorUMDFile,
  validateExportVariableName,
} from '../utils/parseExports';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
init;

const CJSNamedExportPrefix = 'esm-named-export:';

interface FileInfo {
  isESM: boolean;
  hasDefaultExport: boolean;
}

const fileLoc2FileInfo: Record<string, FileInfo> = {};

/* eslint-disable consistent-return */
async function autoDetectExports(
  fileLoc: string,
  logger = console,
): Promise<string[] | undefined> {
  if (!/\.(?:js|cjs|mjs)$/.test(fileLoc)) {
    return;
  }
  let fileInfo = fileLoc2FileInfo[fileLoc];
  if ('undefined' === typeof fileInfo) {
    const code = (await fs.readFile(fileLoc)).toString();
    const [imports, exports] = parse(code);
    const isESM = Boolean(imports.length) || Boolean(exports.length);
    let hasDefaultExport = false;
    if (isESM) {
      hasDefaultExport = exports.includes('default');
    } else {
      hasDefaultExport =
        code.includes('exports') ||
        /* just for logic, intentionally useless */ code.includes(
          'module.exports',
        );
    }
    fileInfo = {
      isESM,
      hasDefaultExport,
    };
    fileLoc2FileInfo[fileLoc] = fileInfo;
  }
  try {
    if (!fileInfo.isESM) {
      const moduleExports = require(fileLoc);
      const ret = Object.keys(moduleExports);
      if (!ret.length && isPlainObject(moduleExports)) {
        // if module.exports is plain object with no key, it is a module just for side effect.
        fileInfo.hasDefaultExport = false;
      }
      return ret.filter(k => validateExportVariableName(k));
    }
  } catch (_e1) {
    try {
      // try again with parse ast
      return parseExportVariableNamesFromCJSorUMDFile(fileLoc);
    } catch (_e2) {
      logger.error(`✘ Could not auto-detect exports for ${fileLoc}`);
    }
  }
}
/* eslint-enable consistent-return */

function rollupPluginCJSNamedExportDetect(): Plugin {
  return {
    name: 'cjs-named-export-detect',
    options(inputOptions) {
      const originalInput = inputOptions.input;
      let input = originalInput!;
      if ('string' === typeof input) {
        input = `${CJSNamedExportPrefix}${input}`;
      } else if (Array.isArray(input)) {
        input = input.map(i => `${CJSNamedExportPrefix}${i}`);
      } else if ('object' === typeof input) {
        input = { ...input };
        for (const [key, val] of Object.entries(input)) {
          input[key] = `${CJSNamedExportPrefix}${val}`;
        }
      }
      return {
        ...inputOptions,
        input,
      };
    },
    resolveId(source) {
      if (source.startsWith(CJSNamedExportPrefix)) {
        return source;
      }
      return null;
    },
    async load(id) {
      if (!id.startsWith(CJSNamedExportPrefix)) {
        return null;
      }
      let fileLoc = id.substring(CJSNamedExportPrefix.length);
      const uniqueNamedImports = new Set<string>();
      const resolved = await this.resolve(fileLoc);
      if (!resolved || !resolved.id) {
        return null;
      }
      fileLoc = resolved.id;
      const normalizedFileLoc = fileLoc
        .split(path.win32.sep)
        .join(path.posix.sep);
      let detected: string[] | undefined;
      try {
        detected = await autoDetectExports(normalizedFileLoc);
      } catch (e) {
        // no-catch
      }
      if (Array.isArray(detected)) {
        detected.forEach(x => uniqueNamedImports.add(x));
      }
      const resultArr = [`export * from '${normalizedFileLoc}';`];
      // fileInfo should be ready after autoDetectExports
      const fileInfo = fileLoc2FileInfo[normalizedFileLoc];
      if (fileInfo?.hasDefaultExport) {
        resultArr.push(
          `import __eds_default_export__ from '${normalizedFileLoc}';\nexport default __eds_default_export__;`,
        );
      }
      if (uniqueNamedImports.size) {
        resultArr.push(
          `export {${Array.from(uniqueNamedImports)
            .filter(x => x !== 'default')
            .join(',')}} from '${normalizedFileLoc}';`,
        );
      }
      const result = resultArr.join('\n');
      return result;
    },
  };
}

export default rollupPluginCJSNamedExportDetect;
export { CJSNamedExportPrefix, rollupPluginCJSNamedExportDetect };
