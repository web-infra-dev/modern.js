import path from 'path';
import {
  findExists,
  fs,
  getEntryOptions,
  JS_EXTENSIONS,
  SERVER_RENDER_FUNCTION_NAME,
} from '@modern-js/utils';
import { IAppContext, PluginAPI } from '@modern-js/core';
import type { Entrypoint } from '@modern-js/types';
import { RspackConfig, WebpackConfig } from '@rsbuild/shared';
import {
  AppNormalizedConfig,
  AppTools,
  ImportSpecifier,
  ImportStatement,
} from '../../types';
import * as templates from './templates';
import { ENTRY_POINT_FILE_NAME, ENTRY_BOOTSTRAP_FILE_NAME } from './constants';
import { getDefaultImports } from './utils';

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

export const createImportStatements = (
  statements: ImportStatement[],
): string => {
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
      // make "initialize" param can be connected when multiple plugins were imported from same package
      const modifyIndex = deDuplicated.findIndex(v => v.value === value);
      const originInitialize = deDuplicated[modifyIndex]?.initialize ?? '';
      deDuplicated[modifyIndex].initialize = originInitialize.concat(
        `\n${initialize || ''}`,
      );
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
  config: AppNormalizedConfig<'shared'>,
  entrypoints: Entrypoint[],
  api: PluginAPI<AppTools<'shared'>>,
) => {
  const {
    internalDirectory,
    srcDirectory,
    appDirectory,
    internalDirAlias,
    internalSrcAlias,
    runtimeConfigFile,
  } = appContext;

  const hookRunners = api.useHookRunners();
  const customRuntimeConfig = findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(srcDirectory, `${runtimeConfigFile}${ext}`),
    ),
  );
  const importsStatemets = new Map<string, ImportStatement[]>();

  await Promise.all(
    entrypoints.map(entrypoint =>
      generateEntryCode(entrypoint, customRuntimeConfig),
    ),
  );

  return {
    importsStatemets,
  };

  async function generateEntryCode(
    entrypoint: Entrypoint,
    customRuntimeConfig: string | false,
  ) {
    const { entryName, isAutoMount } = entrypoint;
    if (isAutoMount) {
      // call modifyEntryImports hook
      const { imports } = await hookRunners.modifyEntryImports({
        entrypoint,
        imports: getDefaultImports({
          entrypoint,
          srcDirectory,
          appDirectory,
          internalSrcAlias,
          internalDirAlias,
          runtimeConfigFile,
          customRuntimeConfig,
        }),
      });
      importsStatemets.set(entryName, imports);

      const entryFile = path.resolve(
        internalDirectory,
        `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
      );
      entrypoint.internalEntry = entryFile;
    }
  }
};

export const generateIndexCode = async ({
  appContext,
  api,
  entrypoints,
  config,
  importsStatemets,
  bundlerConfigs,
}: {
  appContext: IAppContext;
  api: PluginAPI<AppTools<'shared'>>;
  entrypoints: Entrypoint[];
  config: AppNormalizedConfig<'shared'>;
  importsStatemets: Map<string, ImportStatement[]>;
  bundlerConfigs?: RspackConfig[] | WebpackConfig[];
}) => {
  const hookRunners = api.useHookRunners();
  const { mountId } = config.html;
  const { internalDirectory, packageName, srcDirectory, runtimeConfigFile } =
    appContext;
  const customRuntimeConfig = findExists(
    JS_EXTENSIONS.map(ext =>
      path.resolve(srcDirectory, `${runtimeConfigFile}${ext}`),
    ),
  );
  await Promise.all(
    entrypoints.map(async entrypoint => {
      const {
        entryName,
        isMainEntry,
        isAutoMount,
        customBootstrap,
        fileSystemRoutes,
      } = entrypoint;
      if (isAutoMount) {
        // call modifyEntryRuntimePlugins hook
        const { plugins } = await hookRunners.modifyEntryRuntimePlugins({
          entrypoint,
          plugins: [],
          bundlerConfigs: bundlerConfigs as any,
        });

        // call modifyEntryRenderFunction hook
        const { code: renderFunction } =
          await hookRunners.modifyEntryRenderFunction({
            entrypoint,
            code: templates.renderFunction({
              plugins,
              customBootstrap,
              customRuntimeConfig,
              fileSystemRoutes,
            }),
          });

        // call modifyEntryExport hook
        const { exportStatement } = await hookRunners.modifyEntryExport({
          entrypoint,
          exportStatement: 'export default AppWrapper;',
        });

        const imports = importsStatemets.get(entryName)!;

        const code = templates.index({
          mountId: mountId as string,
          imports: createImportStatements(imports),
          renderFunction,
          exportStatement,
        });

        const entryFile = path.resolve(
          internalDirectory,
          `./${entryName}/${ENTRY_POINT_FILE_NAME}`,
        );
        // generate entry file.
        if (config.source.enableAsyncEntry) {
          let rawAsyncEntryCode = `import('./${ENTRY_BOOTSTRAP_FILE_NAME}');`;
          const ssr = getEntryOptions(
            entryName,
            isMainEntry,
            config.server.ssr,
            config.server.ssrByEntries,
            packageName,
          );
          if (ssr) {
            rawAsyncEntryCode = `
        export const ${SERVER_RENDER_FUNCTION_NAME} = async (...args) => {
          let entry = await ${rawAsyncEntryCode};
          if (entry.default instanceof Promise){
            entry = await entry.default;
            return entry.default.${SERVER_RENDER_FUNCTION_NAME}.apply(null, args);
          }
          return entry.${SERVER_RENDER_FUNCTION_NAME}.apply(null, args);
        };
        if(typeof window!=='undefined'){
          ${rawAsyncEntryCode}
        }
        `;
          }
          const { code: asyncEntryCode } = await hookRunners.modifyAsyncEntry({
            entrypoint,
            code: rawAsyncEntryCode,
          });
          fs.outputFileSync(entryFile, asyncEntryCode, 'utf8');

          const bootstrapFile = path.resolve(
            internalDirectory,
            `./${entryName}/${ENTRY_BOOTSTRAP_FILE_NAME}`,
          );
          fs.outputFileSync(bootstrapFile, code, 'utf8');
        } else {
          fs.outputFileSync(entryFile, code, 'utf8');
        }
      }
    }),
  );
};
