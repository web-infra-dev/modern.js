import type { DeclarationTransformerFactory } from '@modern-js/server-utils';
import type ts from 'typescript';

/**
 * Declaration-emit transformer (tsc `afterDeclarations`).
 *
 * When tsc emits declarations for api files, types inferred from handler
 * factories are printed as synthesized `import("<declaring package>")` type
 * references. For BFF that declaring package is the server-only
 * `@modern-js/bff-core`, which consumers of a crossProject api package do
 * not depend on — so an upper-layer framework can retarget those references
 * to a package it owns at the moment the declaration AST is produced,
 * instead of post-processing emitted files.
 *
 * The rewrite happens on `ImportTypeNode`s in the declaration AST, not on
 * output text, so quoting/formatting never matters and nothing but module
 * specifiers can be affected.
 */
export const createImportTypeRetargetTransformer =
  (from: string, to: string): DeclarationTransformerFactory =>
  tsInstance =>
  context => {
    const { factory } = context;
    const visit = (node: ts.Node): ts.Node => {
      const retargeted =
        tsInstance.isImportTypeNode(node) &&
        tsInstance.isLiteralTypeNode(node.argument) &&
        tsInstance.isStringLiteral(node.argument.literal) &&
        node.argument.literal.text === from
          ? factory.updateImportTypeNode(
              node,
              factory.createLiteralTypeNode(factory.createStringLiteral(to)),
              node.attributes,
              node.qualifier,
              node.typeArguments,
              node.isTypeOf,
            )
          : node;
      return tsInstance.visitEachChild(retargeted, visit, context);
    };
    return node => tsInstance.visitEachChild(node, visit, context);
  };
