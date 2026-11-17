import { isBuiltin } from 'node:module';
import ts from 'typescript';

export interface Reference {
  specifier: string;
  line: number;
  optional: boolean;
  typeOnly?: boolean;
  resolutionOnly?: boolean;
}

export function getPackageName(specifier: string): string | null {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('#') ||
    specifier.startsWith('\\') ||
    specifier.includes(':') ||
    isBuiltin(specifier)
  ) {
    return null;
  }
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? `${parts[0]}/${parts[1] ?? ''}`
    : parts[0];
  return /^(?:@[\w.-]+\/)?[\w.-]+$/.test(name) ? name : null;
}

export function getTypesPackageName(name: string): string {
  return name.startsWith('@')
    ? `@types/${name.slice(1).replace('/', '__')}`
    : `@types/${name}`;
}

export function extractReferences(fileName: string, code: string): Reference[] {
  const source = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
  );
  const references: Reference[] = [];
  const add = (
    node: ts.Node,
    value: ts.Expression,
    optional = false,
    typeOnly = false,
    resolutionOnly = false,
  ) => {
    if (ts.isStringLiteralLike(value)) {
      references.push({
        specifier: value.text,
        line:
          source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1,
        optional,
        typeOnly: typeOnly || /\.d\.[cm]?ts$/.test(fileName),
        resolutionOnly,
      });
    }
  };
  const visit = (node: ts.Node, optional: boolean) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      const typeOnly = ts.isImportDeclaration(node)
        ? node.importClause?.isTypeOnly ||
          (node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings) &&
            !node.importClause.name &&
            node.importClause.namedBindings.elements.length > 0 &&
            node.importClause.namedBindings.elements.every(
              element => element.isTypeOnly,
            ))
        : node.isTypeOnly ||
          (node.exportClause &&
            ts.isNamedExports(node.exportClause) &&
            node.exportClause.elements.length > 0 &&
            node.exportClause.elements.every(element => element.isTypeOnly));
      add(node, node.moduleSpecifier, false, Boolean(typeOnly));
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression
    ) {
      add(node, node.moduleReference.expression);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument)
    ) {
      add(node, node.argument.literal, false, true);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const callee = node.expression;
      if (
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === 'require')
      ) {
        add(node, node.arguments[0], optional);
      } else if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'require' &&
        callee.name.text === 'resolve'
      ) {
        add(node, node.arguments[0], optional, false, true);
      }
    }
    if (ts.isTryStatement(node) && node.catchClause) {
      visit(node.tryBlock, true);
      visit(node.catchClause, optional);
      if (node.finallyBlock) visit(node.finallyBlock, optional);
    } else {
      ts.forEachChild(node, child => visit(child, optional));
    }
  };
  visit(source, false);
  for (const reference of source.referencedFiles) {
    references.push({
      specifier: reference.fileName.startsWith('.')
        ? reference.fileName
        : `./${reference.fileName}`,
      line: source.getLineAndCharacterOfPosition(reference.pos).line + 1,
      optional: false,
      typeOnly: true,
    });
  }
  for (const reference of source.typeReferenceDirectives) {
    const name = reference.fileName;
    references.push({
      specifier: name,
      line: source.getLineAndCharacterOfPosition(reference.pos).line + 1,
      optional: false,
      typeOnly: true,
    });
  }
  return references;
}
