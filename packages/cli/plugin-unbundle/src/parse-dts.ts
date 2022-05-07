import fs from 'fs';
import { merge } from '@modern-js/utils/lodash';
import ts from 'typescript';

let enumsMap = {};

const createEnumObject = (enumNode: ts.EnumDeclaration, namespace?: string) => {
  let obj: Record<string, unknown> = {};
  const final = obj;
  if (namespace) {
    namespace.split('.').forEach(s => {
      // eslint-disable-next-line no-multi-assign
      obj = obj[s] = {};
    });
  }

  // eslint-disable-next-line no-multi-assign
  obj = obj[enumNode.name.escapedText as string] = {};

  enumNode.members
    .filter((member: ts.EnumMember) => member.kind === ts.SyntaxKind.EnumMember)
    .forEach(m => {
      obj[(m.name as ts.Identifier).escapedText as string] =
        m.initializer?.kind === ts.SyntaxKind.NumericLiteral
          ? // @ts-expect-error
            Number(m.initializer.text)
          : // @ts-expect-error
            m.initializer?.text;
    });

  enumsMap = merge(enumsMap, final);
};

const visit = (node: ts.Node) => {
  if (
    node.kind === ts.SyntaxKind.EnumDeclaration &&
    node.modifiers &&
    node?.modifiers[0].kind === ts.SyntaxKind.DeclareKeyword &&
    node?.modifiers[1].kind === ts.SyntaxKind.ConstKeyword
  ) {
    createEnumObject(node as ts.EnumDeclaration);
  }

  if (
    node.kind === ts.SyntaxKind.ModuleDeclaration &&
    node.modifiers &&
    node.modifiers[0].kind === ts.SyntaxKind.DeclareKeyword
  ) {
    let namespace = (node as any).name.escapedText;
    let declaration = (node as any).body;
    while (declaration?.kind === ts.SyntaxKind.ModuleDeclaration) {
      namespace += `.${declaration.name.escapedText}`;
      declaration = declaration.body;
    }

    if (declaration?.kind === ts.SyntaxKind.ModuleBlock) {
      declaration.statements
        .filter((s: any) => s.kind === ts.SyntaxKind.EnumDeclaration)
        .forEach((s: any) => {
          createEnumObject(s, namespace);
        });
    }
  }

  ts.forEachChild(node, visit);
};

/**
 *
 * parse const enum in dts
 *
 * declare const enum Test {
 *  a = 1,
 *  b = 2,
 * }
 *
 * Test: {
 *  a: 1,
 *  b: 2,
 * }
 */
export const parseDTS = (files: string[]): Record<string, unknown> => {
  for (const filepath of files) {
    if (fs.existsSync(filepath)) {
      const source = ts.createSourceFile(
        filepath,
        fs.readFileSync(filepath, 'utf8'),
        ts.ScriptTarget.ES2015,
      );
      visit(source);
    }
  }

  return enumsMap;
};
