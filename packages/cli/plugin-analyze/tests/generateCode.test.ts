import { createImportStatements } from '../src/generateCode';

describe('generate code', () => {
  test('should create import statements successfully', () => {
    const statement = createImportStatements([
      {
        value: 'react',
        specifiers: [
          {
            local: 'React',
          },
          {
            imported: 'useState',
          },
          {
            imported: 'useEffect',
          },
        ],
      },
    ]);
    expect(statement).toEqual(
      `import React, { useState, useEffect } from 'react';\n`,
    );
  });

  test('should merge statements', () => {
    const statement = createImportStatements([
      {
        value: 'a',
        specifiers: [
          {
            local: 'b',
            imported: 'c',
          },
        ],
      },
      {
        value: 'a',
        specifiers: [
          {
            imported: 'd',
          },
        ],
      },
    ]);
    expect(statement).toEqual(`import { c as b, d } from 'a';\n\n`);
  });

  test(`should create import statement with initialize string`, () => {
    expect(
      createImportStatements([
        {
          value: 'a',
          specifiers: [
            {
              local: 'a',
            },
          ],
          initialize: 'console.log(a);',
        },
      ]),
    ).toEqual(`import a from 'a';\nconsole.log(a);`);
  });
});
