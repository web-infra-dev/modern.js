import { logger } from '@modern-js/utils';
import { type FunctionBody, type ParseResult, parseAsync } from 'oxc-parser';

export const parseSourceWithOxc = async (source: string, filename: string) => {
  return await parseAsync(source, {
    sourceFilename: filename,
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

export const isClientModule = async (ast: ParseResult) => {
  return checkDirective(ast, 'use client');
};

const checkDirective = async (ast: ParseResult, originDirective: string) => {
  return ast.program.directives.find(
    directive => directive.directive === originDirective,
  );
};

// for 循环遍历 oxc 的 ast
// 判断当前模块有没有全局 use server 指令
// 如果有，收集所有 export 的函数，作为 Server Action
// 如果没有，收集声明 use server 的函数，作为 Server Action
// 检查每个函数有没有声明 use server 指令

// 当 hasModuleUseServer 为 false 时，所有最外层的函数都应该判断有没有 use server 指令
// 当 hasModuleUseServer 为 true 时，所有最外层的函数直接被收集

export const getModuleUseServerInfo = (ast: ParseResult) => {
  const directive = ast.program.directives.find(
    directive => directive.directive === 'use server',
  );
  if (!directive) return null;
  return {
    directive: directive.directive,
    start: directive.start,
    end: directive.end,
  };
};

export function getServerActions(ast: ParseResult): ServerAction[] {
  const hasModuleUseServer = getModuleUseServerInfo(ast);
  const serverActions: ServerAction[] = [];
  const currentExports: Map<string, string> = new Map();

  const checkUseServer = (body: FunctionBody) => {
    return body.directives.some(
      directive =>
        directive.type === 'Directive' && directive.directive === 'use server',
    );
  };
  for (const node of ast.program.body) {
    switch (node.type) {
      case 'ExportDefaultDeclaration':
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            if (
              hasModuleUseServer ||
              (node.declaration.body && checkUseServer(node.declaration.body))
            ) {
              serverActions.push({
                localName: node.declaration.id?.name || '',
                exportName:
                  node.exported.type === 'Identifier'
                    ? node.exported.name
                    : 'default',
                span: {
                  start: node.start,
                  end: node.end,
                },
              });
            }
          }
          if (node.declaration.type === 'ArrowFunctionExpression') {
            if (
              hasModuleUseServer ||
              (node.declaration.body && checkUseServer(node.declaration.body))
            ) {
              serverActions.push({
                localName: 'default',
                exportName: 'default',
                span: {
                  start: node.start,
                  end: node.end,
                },
              });
            }
          }
          if (node.declaration.type === 'Identifier') {
            currentExports.set(node.declaration.name, 'default');
          }
        }
        break;
      case 'ExportNamedDeclaration':
        if (node.specifiers) {
          node.specifiers.forEach(specifier => {
            if (
              specifier.type === 'ExportSpecifier' &&
              specifier.local.type === 'Identifier' &&
              specifier.exported?.type === 'Identifier'
            ) {
              const localName = specifier.local.name;
              const exportName = specifier.exported.name;
              currentExports.set(localName, exportName);
            }
          });
        }
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            if (
              hasModuleUseServer ||
              (node.declaration.body && checkUseServer(node.declaration.body))
            ) {
              serverActions.push({
                localName: node.declaration.id?.name || '',
                exportName: node.declaration.id?.name || '',
                span: {
                  start: node.start,
                  end: node.end,
                },
              });
            }
          } else if (node.declaration.type === 'VariableDeclaration') {
            for (const declarator of node.declaration.declarations) {
              if (
                declarator.init?.type === 'ArrowFunctionExpression' &&
                (hasModuleUseServer || checkUseServer(declarator.init.body))
              ) {
                serverActions.push({
                  localName:
                    declarator.id.type === 'Identifier'
                      ? declarator.id.name
                      : '',
                  exportName:
                    declarator.id.type === 'Identifier'
                      ? declarator.id.name
                      : '',
                  span: {
                    start: node.start,
                    end: node.end,
                  },
                });
              }
            }
          }
        }
        break;
      case 'FunctionDeclaration':
        if (hasModuleUseServer || (node.body && checkUseServer(node.body))) {
          serverActions.push({
            localName: node.id?.name || '',
            span: {
              start: node.start,
              end: node.end,
            },
          });
        }
        break;

      case 'VariableDeclaration':
        for (const declarator of node.declarations) {
          if (
            declarator.init?.type === 'ArrowFunctionExpression' &&
            (hasModuleUseServer || checkUseServer(declarator.init.body))
          ) {
            serverActions.push({
              localName:
                declarator.id.type === 'Identifier' ? declarator.id.name : '',
              span: {
                start: node.start,
                end: node.end,
              },
            });
          }
        }
        break;
    }
  }

  return serverActions.map(serverAction => ({
    ...serverAction,
    exportName:
      serverAction.exportName ?? currentExports.get(serverAction.localName),
  }));
}
