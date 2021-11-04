import path from 'path';
import { fs } from '@modern-js/utils';
import { IAppContext, mountHook, NormalizedConfig } from '@modern-js/core';
import type { Entrypoint } from '@modern-js/types';
import * as templates from './templates';
import { getClientRoutes } from './getClientRoutes';
import {
  FILE_SYSTEM_ROUTES_FILE_NAME,
  ENTRY_POINT_FILE_NAME,
} from './constants';
import { getDefaultImports } from './utils';

export interface ImportSpecifier {
  local?: string;
  imported?: string;
}

export interface ImportStatement {
  specifiers: ImportSpecifier[];
  value: string;
  initialize?: string;
}

const createImportSpecifier = (specifiers: ImportSpecifier[]): string => {
  let defaults = '';

  const named = [];

  for (const { local, imported } of specifiers) {
    if (local && imported) {
      named.push(`${imported} as ${local}`);
    } else if (local) {
      defaults = local;
    } else {
      named.push(imported);
    }
  }

  if (defaults && named.length) {
    return `${defaults}, { ${named.join(', ')} }`;
  } else if (defaults) {
    return defaults;
  } else {
    return `{ ${named.join(', ')} }`;
  }
};

const createImportStatements = (statements: ImportStatement[]): string => {
  // merge import statements with the same value.
  const deDuplicated: ImportStatement[] = [];

  const seen = new Map();

  for (const { value, specifiers, initialize } of statements) {
    if (!seen.has(value)) {
      deDuplicated.push({
        value,
        specifiers,
        initialize,
      });
      seen.set(value, specifiers);
    } else {
      seen.get(value).push(...specifiers);
    }
  }

  return deDuplicated
    .map(
      ({ value, specifiers, initialize }) =>
        `import ${createImportSpecifier(specifiers)} from '${value}';\n${
          initialize || ''
        }`,
    )
    .join('\n');
};

export const generateCode = async (
  appContext: IAppContext,
  config: NormalizedConfig,
  entrypoints: Entrypoint[],
) => {
  const { internalDirectory, srcDirectory } = appContext;

  const {
    output: { mountId },
  } = config;

  for (const entrypoint of entrypoints) {
    const { entryName, isAutoMount, customBootstrap, fileSystemRoutes } =
      entrypoint;
    if (isAutoMount) {
      // generate routes file for file system routes entrypoint.
      if (fileSystemRoutes) {
        const initialRoutes = getClientRoutes({
          entrypoint,
          srcDirectory,
          internalDirectory,
        });

        const { routes } = await (mountHook() as any).modifyFileSystemRoutes({
          entrypoint,
          routes: initialRoutes,
        });

        fs.outputFileSync(
          path.resolve(
            internalDirectory,
            `./${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
          ),
          templates.fileSystemRoutes({ routes }),
          'utf8',
        );
      }

      // call modifyEntryImports hook
      const { imports: importStatements } = await (
        mountHook() as any
      ).modifyEntryImports({
        entrypoint,
        imports: getDefaultImports({
          entrypoint,
          srcDirectory,
        }),
      });

      // call modifyEntryRuntimePlugins hook
      const { plugins } = await (mountHook() as any).modifyEntryRuntimePlugins({
        entrypoint,
        plugins: [],
      });

      // call modifyEntryRenderFunction hook
      const { code: renderFunction } = await (
        mountHook() as any
      ).modifyEntryRenderFunction({
        entrypoint,
        code: templates.renderFunction({
          plugins,
          customBootstrap,
          fileSystemRoutes,
        }),
      });

      // call modifyEntryExport hook
      const { exportStatement } = await (mountHook() as any).modifyEntryExport({
        entrypoint,
        exportStatement: 'export default AppWrapper;',
      });

      const code = templates.index({
        mountId: mountId as string,
        imports: createImportStatements(importStatements),
        renderFunction,
        exportStatement,
      });

      // gnerate entry file.
      const entryFile = path.resolve(
        internalDirectory,
        `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
      );

      entrypoint.entry = entryFile;

      fs.outputFileSync(entryFile, code, 'utf8');
    }
  }
};
