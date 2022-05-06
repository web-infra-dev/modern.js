const { jsExtensions } = require('./utils');

module.exports = {
  overrides: [
    {
      files: ['*.ts', '*.d.ts', '*.tsx'],

      /*
       * https://eslint.org/blog/2019/01/future-typescript-eslint
       * https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser
       */
      parser: '@typescript-eslint/parser',
      // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
      plugins: [
        '@typescript-eslint',
        // 'tsdoc'
      ],
      // @BUG
      extends: ['plugin:@typescript-eslint/recommended'],
      // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
      settings: {
        'import/external-module-folders': [
          'node_modules',
          'node_modules/@types',
        ],
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
        },
        'import/resolver': { node: { extensions: jsExtensions } },
      },
      rules: {
        // https://github.com/benmosher/eslint-plugin-import/blob/master/config/typescript.js
        'import/named': 'off',
        camelcase: 'off',
        indent: 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        // type A = { foo: string; }; export { A };
        'no-undef': 'off',
        'prefer-named-capture-group': 'off',
        'no-useless-constructor': 'off',
        'no-array-constructor': 'off',
        'func-call-spacing': 'off',
        // @BUG no ignore
        'no-magic-numbers': 'off',
        semi: 'off',
        'no-empty-function': 'off',
        'equire-await': 'off',
        'require-await': 'off',
        'one-var': ['error', 'never'],
        // 'jsdoc/no-types': 'error',
        'react/require-default-props': 'off',
        // 'jsdoc/check-tag-names': 'off',
        // https://github.com/microsoft/tsdoc/tree/master/eslint-plugin
        // 'tsdoc/syntax': 'warn',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-asserted-optional-chain.md
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/adjacent-overload-signatures.md
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/array-type.md
        '@typescript-eslint/array-type': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-ts-comment.md
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-expect-error': true,
            'ts-ignore': true,
            'ts-nocheck': true,
            'ts-check': false,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-types.md
        '@typescript-eslint/ban-types': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/ban-ts-comment.md
        '@typescript-eslint/ban-tslint-comment': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/class-literal-property-style.md
        '@typescript-eslint/class-literal-property-style': ['error', 'fields'],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-indexed-object-style.md
        '@typescript-eslint/consistent-indexed-object-style': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md
        '@typescript-eslint/consistent-type-assertions': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-definitions.md
        '@typescript-eslint/consistent-type-definitions': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-imports.md
        '@typescript-eslint/consistent-type-imports': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-function-return-type.md
        '@typescript-eslint/explicit-function-return-type': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-member-accessibility.md
        '@typescript-eslint/explicit-member-accessibility': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/explicit-module-boundary-types.md
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/indent': [
          'error',
          2,
          {
            SwitchCase: 1,
            VariableDeclarator: 'first',
            outerIIFEBody: 0,
            MemberExpression: 1,
            FunctionDeclaration: { parameters: 'first' },
            FunctionExpression: { parameters: 'first' },
            CallExpression: { arguments: 'first' },
            ArrayExpression: 1,
            ObjectExpression: 1,
            ImportDeclaration: 1,
            flatTernaryExpressions: false,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-delimiter-style.md
        '@typescript-eslint/member-delimiter-style': [
          'error',
          {
            multiline: {
              delimiter: 'semi',
              requireLast: true,
            },
            singleline: {
              delimiter: 'semi',
              requireLast: true,
            },
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/member-ordering.md
        '@typescript-eslint/member-ordering': [
          'error',
          {
            default: [
              'public-static-field',
              'protected-static-field',
              'private-static-field',
              'static-field',
              'public-static-method',
              'protected-static-method',
              'private-static-method',
              'static-method',
              'public-instance-field',
              'protected-instance-field',
              'private-instance-field',
              'instance-field',
              'public-field',
              'protected-field',
              'private-field',
              'field',
              'constructor',
              // 'public-instance-method',
              // 'protected-instance-method',
              // 'private-instance-method',
              'instance-method',
              // 'public-method',
              // 'protected-method',
              // 'private-method',
              'method',
            ],
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/method-signature-style.md
        '@typescript-eslint/method-signature-style': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
        '@typescript-eslint/naming-convention': [
          'error',
          {
            selector: 'default',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
            leadingUnderscore: 'allowSingleOrDouble',
            trailingUnderscore: 'allowSingleOrDouble',
          },
          // https://typescript-eslint.io/rules/naming-convention/#ignore-properties-that-require-quotes
          {
            selector: [
              'classProperty',
              'objectLiteralProperty',
              'typeProperty',
              'classMethod',
              'objectLiteralMethod',
              'typeMethod',
              'accessor',
              'enumMember',
            ],
            format: null,
            modifiers: ['requiresQuotes'],
          },
          {
            selector: 'variable',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
            leadingUnderscore: 'allowSingleOrDouble',
            trailingUnderscore: 'allowSingleOrDouble',
          },

          {
            selector: 'typeLike',
            format: ['PascalCase'],
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-array-constructor.md
        '@typescript-eslint/no-array-constructor': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-interface.md
        '@typescript-eslint/no-empty-interface': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md
        // @TODO disable?
        '@typescript-eslint/no-explicit-any': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extraneous-class.md
        '@typescript-eslint/no-extraneous-class': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules
        '@typescript-eslint/no-implicit-any-catch': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-inferrable-types.md
        '@typescript-eslint/no-inferrable-types': [
          'error',
          { ignoreProperties: true },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-new.md
        '@typescript-eslint/no-misused-new': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-namespace.md
        '@typescript-eslint/no-namespace': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-confusing-non-null-assertion.md
        '@typescript-eslint/no-confusing-non-null-assertion': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-confusing-void-expression.md
        '@typescript-eslint/no-confusing-void-expression': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-non-null-assertion.md
        // @feedback 在 middleware 下，如果有些参数是 optional 的，会在上一层被拦截掉，下一层一定会有这个参数
        '@typescript-eslint/no-non-null-assertion': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-non-null-assertion.md
        '@typescript-eslint/no-extra-non-null-assertion': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-parameter-properties.md
        '@typescript-eslint/no-parameter-properties': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-require-imports.md
        '@typescript-eslint/no-require-imports': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-this-alias.md
        '@typescript-eslint/no-this-alias': [
          'error',
          { allowDestructuring: true },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-type-alias.md
        '@typescript-eslint/no-type-alias': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-condition.md
        '@typescript-eslint/no-unnecessary-condition': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-constraint.md
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-vars.md
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
            caughtErrors: 'none',
          },
        ],
        '@babel/no-unused-expressions': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unused-expressions.md
        '@typescript-eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: true,
            allowTernary: false,
            allowTaggedTemplates: true,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md
        '@typescript-eslint/no-use-before-define': [
          'error',
          {
            functions: false,
            classes: false,
            variables: false,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-useless-constructor.md
        '@typescript-eslint/no-useless-constructor': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-var-requires.md
        '@typescript-eslint/no-var-requires': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-as-const.md
        '@typescript-eslint/prefer-as-const': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-enum-initializers.md
        '@typescript-eslint/prefer-enum-initializers': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-for-of.md
        '@typescript-eslint/prefer-for-of': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-function-type.md
        '@typescript-eslint/prefer-function-type': 'error',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-namespace-keyword.md
        '@typescript-eslint/prefer-namespace-keyword': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-literal-enum-member.md
        '@typescript-eslint/prefer-literal-enum-member': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-optional-chain.md
        '@typescript-eslint/prefer-optional-chain': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-nullish-coalescing.md
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly-parameter-types.md
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-reduce-type-parameter.md
        '@typescript-eslint/prefer-reduce-type-parameter': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-ts-expect-error.md
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/promise-function-async.md
        // @BUG
        '@typescript-eslint/promise-function-async': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-array-sort-compare.md
        '@typescript-eslint/require-array-sort-compare': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/triple-slash-reference.md
        '@typescript-eslint/triple-slash-reference': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/type-annotation-spacing.md
        '@typescript-eslint/type-annotation-spacing': [
          'error',
          {
            before: false,
            after: true,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unified-signatures.md
        '@typescript-eslint/unified-signatures': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/func-call-spacing.md
        '@typescript-eslint/func-call-spacing': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-magic-numbers.md
        '@typescript-eslint/no-magic-numbers': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/semi.md
        '@typescript-eslint/semi': ['error', 'always'],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-function.md
        '@typescript-eslint/no-empty-function': ['error', { allow: [] }],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/strict-boolean-expressions.md
        '@typescript-eslint/strict-boolean-expressions': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/typedef.md
        '@typescript-eslint/typedef': [
          'error',
          {
            arrayDestructuring: false,
            arrowParameter: false,
            memberVariableDeclaration: true,
            objectDestructuring: false,
            parameter: false,
            propertyDeclaration: true,
            variableDeclaration: false,
            variableDeclarationIgnoreFunction: true,
          },
        ],

        'brace-style': 'off',
        '@typescript-eslint/brace-style': [
          'error',
          '1tbs',
          { allowSingleLine: true },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/comma-dangle.md
        'comma-dangle': 'off',
        '@typescript-eslint/comma-dangle': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/comma-spacing.md
        'comma-spacing': 'off',
        '@typescript-eslint/comma-spacing': [
          'error',
          {
            before: false,
            after: true,
          },
        ],

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/keyword-spacing.md
        'keyword-spacing': 'off',
        '@typescript-eslint/keyword-spacing': [
          'error',
          {
            before: true,
            after: true,
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/lines-between-class-members.md
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': ['error', 'always'],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-dupe-class-members.md
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-parens.md
        'no-extra-parens': 'off',
        '@typescript-eslint/no-extra-parens': [
          'error',
          'all',
          { ignoreJSX: 'multi-line' },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-extra-semi.md
        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': 'error',

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-loop-func.md
        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-redeclare.md
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],

        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/space-before-function-paren.md
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': [
          'error',
          {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always',
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/space-infix-ops.md
        'space-infix-ops': 'off',
        '@typescript-eslint/space-infix-ops': 'error',
      },
    },
  ],
};
