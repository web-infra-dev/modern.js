import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';

// Construct import statement for AST
// Such as: import image1 from './test.png'
export const getASTNodeImport = (name: string, from: string) =>
  ({
    type: 'mdxjsEsm',
    value: `import ${name} from ${JSON.stringify(from)}`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ImportDeclaration',
            specifiers: [
              {
                type: 'ImportDefaultSpecifier',
                local: { type: 'Identifier', name },
              },
            ],
            source: {
              type: 'Literal',
              value: from,
              raw: `${JSON.stringify(from)}`,
            },
          },
        ],
      },
    },
  } as MdxjsEsm);
