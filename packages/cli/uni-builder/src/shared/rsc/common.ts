export type {
  ClientReference,
  ImportManifestEntry,
  ModuleLoading,
  SSRManifest,
  SSRModuleMap,
  ClientReferencesMap,
  ServerReferencesMap,
  ServerManifest,
  ServerReferencesModuleInfo,
  ClientManifest,
} from '@modern-js/types/server';
import { logger } from '@modern-js/utils';
import type { Rspack } from '@rsbuild/core';
import { type ExportNamedDeclaration, type Module, parse } from '@swc/core';

export const rspackRscLayerName = `react-server`;

export type SourceMap = Parameters<Rspack.LoaderDefinitionFunction>[1];

export const MODERN_RSC_INFO = 'modernRscInfo';

export const sharedData = {
  store: new Map<string, any>(),

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T;
  },

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  },

  clear() {
    this.store.clear();
  },
};

export function setBuildInfo(
  mod: Rspack.Module,
  property: Record<string, any>,
) {
  if (!mod.buildInfo) {
    mod.buildInfo = {} as Rspack.Module['buildInfo'];
  }

  Object.assign(mod.buildInfo, property);
}

export function setRscBuildInfo(
  mod: Rspack.Module,
  property: Record<string, any>,
) {
  if (!mod.buildInfo) {
    mod.buildInfo = {} as Rspack.Module['buildInfo'];
  }
  const rscBuildInfo = mod.buildInfo[MODERN_RSC_INFO] || {};

  Object.assign(rscBuildInfo, property);
  setBuildInfo(mod, { [MODERN_RSC_INFO]: rscBuildInfo });
}

export function removeRscBuildInfo(mod: Rspack.Module) {
  delete mod.buildInfo?.[MODERN_RSC_INFO];
}

export function getRscBuildInfo(mod: Rspack.Module) {
  return mod.buildInfo?.[MODERN_RSC_INFO];
}

export function isCssModule(mod: Rspack.Module) {
  if (!mod) return false;
  return getRscBuildInfo(mod)?.isCssModule;
}

export const parseSource = async (source: string) => {
  return await parse(source, {
    syntax: 'typescript',
    tsx: true,
    dynamicImport: true,
  });
};

export const getExportNames = async (ast: Module, collectFuncOnly = false) => {
  const exportNames: string[] = [];

  ast.body.forEach(node => {
    if (node.type === 'ExportNamedDeclaration') {
      const namedExport = node as ExportNamedDeclaration;
      namedExport.specifiers.forEach(specifier => {
        if (specifier.type === 'ExportSpecifier') {
          exportNames.push(specifier.exported?.value || specifier.orig.value);
        }
      });
    }

    if (node.type === 'ExportDeclaration') {
      if (node.declaration.type === 'VariableDeclaration') {
        node.declaration.declarations.forEach(decl => {
          if (decl.id.type === 'Identifier') {
            if (!collectFuncOnly) {
              exportNames.push(decl.id.value);
            } else {
              if (
                decl.init?.type === 'FunctionExpression' ||
                decl.init?.type === 'ArrowFunctionExpression'
              ) {
                exportNames.push(decl.id.value);
              }
            }
          }
        });
      }

      if (
        node.declaration.type === 'ClassDeclaration' ||
        node.declaration.type === 'FunctionDeclaration'
      ) {
        if (node.declaration.identifier) {
          exportNames.push(node.declaration.identifier.value);
        }
      }
    }

    if (
      node.type === 'ExportDefaultExpression' ||
      node.type === 'ExportDefaultDeclaration'
    ) {
      exportNames.push('default');
    }
  });
  return exportNames;
};

const checkDirective = async (ast: Module, directive: string) => {
  try {
    for (let i = 0; i < ast.body.length; i++) {
      const node = ast.body[i];
      if (node.type !== 'ExpressionStatement') {
        break;
      }
      if (
        node.expression.type === 'StringLiteral' &&
        node.expression.value === directive
      ) {
        return true;
      }
    }
  } catch (e) {
    logger.error(e);
    return false;
  }
  return false;
};

export const isServerModule = async (ast: Module) => {
  return checkDirective(ast, 'use server');
};

export const isClientModule = async (ast: Module) => {
  return checkDirective(ast, 'use client');
};

export function findRootIssuer(
  modulegraph: Rspack.ModuleGraph,
  module: Rspack.NormalModule,
): Rspack.NormalModule {
  const currentModule = module;
  const issuer = modulegraph.getIssuer(currentModule);

  if (!issuer) {
    return currentModule;
  }

  return findRootIssuer(modulegraph, issuer as Rspack.NormalModule);
}
