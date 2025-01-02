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
import swc, {
  type ArrowFunctionExpression,
  type BlockStatement,
  type ExportNamedDeclaration,
  type ExportSpecifier,
  type Expression,
  type FunctionDeclaration,
  type FunctionExpression,
  type Module,
  type ModuleItem,
  type Program,
  type Statement,
  type StringLiteral,
  type VariableDeclaration,
  parse,
} from '@swc/core';
import { Visitor } from '@swc/core/Visitor.js';
import type {
  Compilation,
  LoaderDefinitionFunction,
  ModuleGraph,
  NormalModule,
  Module as WebpackModule,
} from 'webpack';

export const webpackRscLayerName = `react-server`;

export type SourceMap = Parameters<LoaderDefinitionFunction>[1];

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
  mod: WebpackModule,
  property: Record<string, any>,
) {
  mod.buildInfo = mod.buildInfo || {};

  Object.assign(mod.buildInfo, property);
}

export function setRscBuildInfo(
  mod: WebpackModule,
  property: Record<string, any>,
) {
  mod.buildInfo = mod.buildInfo || {};
  const rscBuildInfo = mod.buildInfo[MODERN_RSC_INFO] || {};

  Object.assign(rscBuildInfo, property);
  setBuildInfo(mod, { [MODERN_RSC_INFO]: rscBuildInfo });
}

export function removeRscBuildInfo(mod: WebpackModule) {
  delete mod.buildInfo?.[MODERN_RSC_INFO];
}

export function getRscBuildInfo(mod: WebpackModule) {
  return mod.buildInfo?.[MODERN_RSC_INFO] || undefined;
}

export function isCssModule(mod: WebpackModule) {
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

export const parseSourceWithOxc = async (source: string, filename: string) => {
  return await parse(source, {
    syntax: 'typescript',
    tsx: true,
    dynamicImport: true,
  });
};

interface ServerAction {
  localName: string;
  exportName?: string;
  span: {
    start: number;
    end: number;
  };
}

class ServerActionCollector extends Visitor {
  private serverActions: ServerAction[] = [];
  private currentExports: Map<string, string> = new Map();
  private isModuleServerActions = false;

  visitProgram(program: Program): Program {
    const result = super.visitProgram(program);

    this.serverActions = this.serverActions.map(action => ({
      ...action,
      exportName:
        this.currentExports.get(action.localName) ||
        action.exportName ||
        action.localName,
    }));

    return result;
  }

  visitExportNamedDeclaration(
    node: ExportNamedDeclaration,
  ): ExportNamedDeclaration {
    if (node.specifiers) {
      node.specifiers.forEach(specifier => {
        if (specifier.type === 'ExportSpecifier') {
          const localName = specifier.orig.value;
          const exportName = specifier.exported?.value || localName;
          this.currentExports.set(localName, exportName);
        }
      });
    }
    return node;
  }

  visitFunctionDeclaration(node: FunctionDeclaration): FunctionDeclaration {
    if (node.body) {
      const hasServer = this.checkForServerDirective(
        node.body,
        node.identifier.value,
      );
      if (hasServer) {
        const serverAction = this.serverActions[this.serverActions.length - 1];
        if (serverAction) {
          serverAction.span = {
            start: node.span.start,
            end: node.span.end,
          };
        }
      }
    }
    return node;
  }

  visitVariableDeclaration(node: VariableDeclaration): VariableDeclaration {
    if (this.isModuleServerActions) {
      this.collectVariableDeclarationFunctions(node);
    } else {
      node.declarations.forEach(decl => {
        if (
          decl.id.type === 'Identifier' &&
          (decl.init?.type === 'ArrowFunctionExpression' ||
            decl.init?.type === 'FunctionExpression')
        ) {
          const localName = decl.id.value;
          this.serverActions.push({
            localName,
            exportName: this.currentExports.get(localName) || localName,
            span: {
              start: decl.init.span.start,
              end: decl.init.span.end,
            },
          });
        }
      });
    }
    return node;
  }

  private checkForServerDirective(
    body: BlockStatement | Expression,
    localName: string,
  ): boolean {
    if (body.type === 'BlockStatement') {
      const hasUseServer = body.stmts.some(
        stmt =>
          stmt.type === 'ExpressionStatement' &&
          stmt.expression.type === 'StringLiteral' &&
          stmt.expression.value === 'use server',
      );

      if (hasUseServer) {
        const serverAction: ServerAction = {
          localName,
          exportName: this.currentExports.get(localName),
          span: {
            start: body.span.start,
            end: body.span.end,
          },
        };
        this.serverActions.push(serverAction);
      }
      return hasUseServer;
    }
    return false;
  }

  private collectVariableDeclarationFunctions(node: VariableDeclaration): void {
    node.declarations.forEach(decl => {
      if (
        decl.id.type === 'Identifier' &&
        (decl.init?.type === 'ArrowFunctionExpression' ||
          decl.init?.type === 'FunctionExpression')
      ) {
        const localName = decl.id.value;
        this.serverActions.push({
          localName,
          exportName: this.currentExports.get(localName) || localName,
          span: {
            start: decl.init.span.start,
            end: decl.init.span.end,
          },
        });
      }
    });
  }

  getServerActions(): ServerAction[] {
    return this.serverActions;
  }
}

export function getServerActions(ast: Module): ServerAction[] {
  const collector = new ServerActionCollector();
  collector.visitProgram(ast);
  return collector.getServerActions();
}

export function findRootIssuer(
  modulegraph: ModuleGraph,
  module: NormalModule,
): NormalModule {
  const currentModule = module;
  const issuer = modulegraph.getIssuer(currentModule);

  if (!issuer) {
    return currentModule;
  }

  return findRootIssuer(modulegraph, issuer as NormalModule);
}
