/* eslint-disable max-lines, no-magic-numbers */
// const path = require('path');

const { jsExtensions } = require('./utils');

module.exports = {
  ignorePatterns: ['**/node_modules/**', '**/dist/**'],
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      impliedStrict: true,
      ecmaVersion: 2018,
      jsx: true,
    },
    sourceType: 'module',
    babelOptions: {
      configFile: require.resolve('@modern-js/babel-preset-app'),
    },
  },
  // https://www.npmjs.com/package/@babel/eslint-parser
  parser: '@babel/eslint-parser',
  // https://eslint.org/docs/user-guide/configuring#specifying-environments
  env: {
    es6: true,
    'shared-node-browser': true,
    browser: false,
    node: false,
    worker: false,
    serviceworker: false,
    mocha: false,
    jest: false,
  },
  // https://eslint.org/docs/user-guide/configuring#specifying-globals
  globals: { gql: 'readable' },
  // https://eslint.org/docs/user-guide/configuring#configuring-plugins
  plugins: [
    // https://www.npmjs.com/package/eslint-plugin-prettier
    'prettier',
    // https://www.npmjs.com/package/@babel/eslint-plugin
    '@babel',
    // https://www.npmjs.com/package/eslint-plugin-react
    'react',
    // https://www.npmjs.com/package/eslint-plugin-react-hooks
    'react-hooks',
    // https://www.npmjs.com/package/eslint-plugin-import
    'import',
    // https://www.npmjs.com/package/eslint-plugin-eslint-comments
    'eslint-comments',
    // https://www.npmjs.com/package/eslint-plugin-filenames
    'filenames',
    // https://www.npmjs.com/package/eslint-plugin-promise
    'promise',
    // https://www.npmjs.com/package/eslint-plugin-node
    'node',
    // https://github.com/gajus/eslint-plugin-jsdoc
    // 'jsdoc',
    // https: //github.com/eslint/eslint-plugin-markdown
    'markdown',
  ],
  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  extends: [
    // https://eslint.org/docs/user-guide/configuring#using-eslintrecommended
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'plugin:node/recommended',
  ],
  // https://eslint.org/docs/user-guide/configuring#configuring-rules
  rules: {
    /*
     * Possible Errors
     * https://eslint.org/docs/rules/for-direction
     */
    'for-direction': 'off',
    // https://eslint.org/docs/rules/getter-return
    'getter-return': ['error', { allowImplicit: true }],
    // https://eslint.org/docs/rules/no-async-promise-executor
    'no-async-promise-executor': 'error',
    // https://eslint.org/docs/rules/no-await-in-loop
    'no-await-in-loop': 'off',
    // https://eslint.org/docs/rules/no-compare-neg-zero
    'no-compare-neg-zero': 'error',
    // https://eslint.org/docs/rules/no-cond-assign
    'no-cond-assign': ['error', 'always'],
    // https://eslint.org/docs/rules/no-console
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    // https://eslint.org/docs/rules/no-constant-condition
    'no-constant-condition': ['error', { checkLoops: false }],

    /*
     * https://eslint.org/docs/rules/no-control-regex
     * @TIPS
     * explicitly declare `eslint-disable` when truly necessary
     */
    'no-control-regex': 'error',

    /*
     * https://eslint.org/docs/rules/no-debugger
     * @TIPS: for non-VSCode users, please use `debugger // eslint-disable-line`
     *        instead of `debugger` to avoid it to be removed by IDE's autoFixOnSave feature
     */
    'no-debugger': 'error',
    // https://eslint.org/docs/rules/no-dupe-args
    'no-dupe-args': 'error',
    // https://eslint.org/docs/rules/no-dupe-keys
    'no-dupe-keys': 'error',
    // https://eslint.org/docs/rules/no-duplicate-case
    'no-duplicate-case': 'error',
    // https://eslint.org/docs/rules/no-empty
    'no-empty': ['error', { allowEmptyCatch: true }],
    // https://eslint.org/docs/rules/no-empty-character-class
    'no-empty-character-class': 'error',
    // https://eslint.org/docs/rules/no-ex-assign
    'no-ex-assign': 'error',
    // https://eslint.org/docs/rules/no-extra-boolean-cast
    'no-extra-boolean-cast': 'error',
    // https://eslint.org/docs/rules/no-extra-parens
    'no-extra-parens': ['error', 'all', { ignoreJSX: 'multi-line' }],
    // https://eslint.org/docs/rules/no-extra-semi
    'no-extra-semi': 'error',
    // https://eslint.org/docs/rules/no-func-assign
    'no-func-assign': 'error',
    // https://eslint.org/docs/rules/no-inner-declarations
    'no-inner-declarations': ['error', 'both'],
    // https://eslint.org/docs/rules/no-invalid-regexp
    'no-invalid-regexp': ['error', { allowConstructorFlags: [] }],
    // https://eslint.org/docs/rules/no-irregular-whitespace
    'no-irregular-whitespace': [
      'error',
      {
        skipStrings: false,
        skipTemplates: false,
        skipComments: false,
        skipRegExps: true,
      },
    ],
    // https://eslint.org/docs/rules/no-misleading-character-class
    'no-misleading-character-class': 'error',
    // https://eslint.org/docs/rules/no-obj-calls
    'no-obj-calls': 'error',
    // https://eslint.org/docs/rules/no-prototype-builtins
    'no-prototype-builtins': 'off',
    // https://eslint.org/docs/rules/no-regex-spaces
    'no-regex-spaces': 'error',
    // https://eslint.org/docs/rules/no-sparse-arrays
    'no-sparse-arrays': 'error',
    // https://eslint.org/docs/rules/no-template-curly-in-string
    'no-template-curly-in-string': 'error',
    // https://eslint.org/docs/rules/no-unexpected-multiline
    'no-unexpected-multiline': 'error',
    // https://eslint.org/docs/rules/no-unreachable
    'no-unreachable': 'error',
    // https://eslint.org/docs/rules/no-unsafe-finally
    'no-unsafe-finally': 'error',
    // https://eslint.org/docs/rules/no-unsafe-negation
    'no-unsafe-negation': 'error',
    // https://eslint.org/docs/rules/require-atomic-updates
    // @bug https://github.com/eslint/eslint/issues/11899
    'require-atomic-updates': 'warn',
    // 'require-atomic-updates': 'error',
    // https://eslint.org/docs/rules/use-isnan
    'use-isnan': 'error',
    // https://eslint.org/docs/rules/valid-typeof
    'valid-typeof': ['error', { requireStringLiterals: true }],

    /*
     * Best Practices
     * https://eslint.org/docs/rules/accessor-pairs
     */
    'accessor-pairs': 'error',
    // https://eslint.org/docs/rules/array-callback-return
    'array-callback-return': ['error', { allowImplicit: true }],
    // https://eslint.org/docs/rules/block-scoped-var
    'block-scoped-var': 'error',
    // https://eslint.org/docs/rules/class-methods-use-this
    // @BUG issue:
    'class-methods-use-this': 'off',
    // 'class-methods-use-this': [
    //   'warn',
    //   {
    //     exceptMethods: [
    //       'getChildContext',
    //       'UNSAFE_componentWillMount',
    //       'componentWillMount',
    //       'componentDidMount',
    //       'UNSAFE_componentWillReceiveProps',
    //       'componentWillReceiveProps',
    //       'shouldComponentUpdate',
    //       'getSnapshotBeforeUpdate',
    //       'UNSAFE_componentWillUpdate',
    //       'componentWillUpdate',
    //       'componentDidUpdate',
    //       'componentWillUnmount',
    //       'componentDidCatch',
    //       'render',
    //     ],
    //   },
    // ],
    // https://eslint.org/docs/rules/complexity
    complexity: ['warn', { max: 30 }],
    // https://eslint.org/docs/rules/consistent-return
    'consistent-return': 'error',
    // https://eslint.org/docs/rules/curly
    curly: 'error',
    // https://eslint.org/docs/rules/default-case
    'default-case': 'error',
    // https://eslint.org/docs/rules/dot-location
    'dot-location': ['error', 'property'],
    // https://eslint.org/docs/rules/dot-notation
    'dot-notation': ['error', { allowKeywords: true }],
    // https://eslint.org/docs/rules/eqeqeq
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    // https://eslint.org/docs/rules/guard-for-in
    'guard-for-in': 'off',
    // https://eslint.org/docs/rules/max-classes-per-file
    'max-classes-per-file': ['error', 3],
    // https://eslint.org/docs/rules/no-alert
    'no-alert': 'error',
    // https://eslint.org/docs/rules/no-caller
    'no-caller': 'error',

    /*
     * https://eslint.org/docs/rules/no-case-declarations
     * @TIPS
     * case 1:
     *   const a = 1;
     * case 2:
     * ->
     * case 1: {
     *   const a = 1;
     * }
     * case 2: {
     */
    'no-case-declarations': 'error',
    // https://eslint.org/docs/rules/no-div-regex
    'no-div-regex': 'error',

    /*
     * https://eslint.org/docs/rules/no-else-return
     * 1. this rule makes it harder to signal that there are two cases and only one of them will run.
     * 2. no upside (with no-unreachable rule)
     */
    'no-else-return': 'off',

    /*
     * "no-else-return": [
     *   "error",
     *   {
     *     "allowElseIf": true
     *   }
     * ],
     * https://eslint.org/docs/rules/no-empty-function
     * @TIPS
     * add commment to explain why we need a empty function/method here
     */
    'no-empty-function': ['error', { allow: [] }],
    // https://eslint.org/docs/rules/no-empty-pattern
    'no-empty-pattern': 'error',
    // https://eslint.org/docs/rules/no-eq-null
    'no-eq-null': 'off',
    // https://eslint.org/docs/rules/no-eval
    'no-eval': 'error',
    // https://eslint.org/docs/rules/no-extend-native
    'no-extend-native': 'error',
    // https://eslint.org/docs/rules/no-extra-bind
    'no-extra-bind': 'error',
    // https://eslint.org/docs/rules/no-extra-label
    'no-extra-label': 'error',
    // https://eslint.org/docs/rules/no-fallthrough
    'no-fallthrough': 'error',
    // https://eslint.org/docs/rules/no-floating-decimal
    'no-floating-decimal': 'error',
    // https://eslint.org/docs/rules/no-global-assign
    'no-global-assign': 'error',
    // https://eslint.org/docs/rules/no-implicit-coercion
    'no-implicit-coercion': ['error', { allow: [] }],
    // https://eslint.org/docs/rules/no-implicit-globals
    'no-implicit-globals': 'error',
    // https://eslint.org/docs/rules/no-implied-eval
    'no-implied-eval': 'error',
    // https://eslint.org/docs/rules/no-invalid-this
    'no-invalid-this': 'off',
    '@babel/no-invalid-this': 'error',
    // https://eslint.org/docs/rules/no-iterator
    'no-iterator': 'error',
    // https://eslint.org/docs/rules/no-labels
    'no-labels': 'error',
    // https://eslint.org/docs/rules/no-lone-blocks
    'no-lone-blocks': 'error',
    // https://eslint.org/docs/rules/no-loop-func
    'no-loop-func': 'error',
    // https://eslint.org/docs/rules/no-magic-numbers
    'no-magic-numbers': [
      'warn',
      {
        ignore: [
          0, 0.5, 0.25, 1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 24, 60, 100,
          1000, 365, 1024,
        ],
        ignoreArrayIndexes: true,
        enforceConst: false,
        detectObjects: false,
      },
    ],
    // https://eslint.org/docs/rules/no-multi-spaces
    'no-multi-spaces': [
      'error',
      {
        ignoreEOLComments: false,
        exceptions: {},
      },
    ],
    // https://eslint.org/docs/rules/no-multi-str
    'no-multi-str': 'error',
    // https://eslint.org/docs/rules/no-new
    'no-new': 'error',
    // https://eslint.org/docs/rules/no-new-func
    'no-new-func': 'error',
    // https://eslint.org/docs/rules/no-new-wrappers
    'no-new-wrappers': 'error',
    // https://eslint.org/docs/rules/no-octal
    'no-octal': 'error',
    // https://eslint.org/docs/rules/no-octal-escape
    'no-octal-escape': 'error',
    // https://eslint.org/docs/rules/no-param-reassign
    'no-param-reassign': ['error', { props: false }],
    // https://eslint.org/docs/rules/no-proto
    'no-proto': 'error',
    // https://eslint.org/docs/rules/no-redeclare
    'no-redeclare': ['error', { builtinGlobals: true }],
    // https://eslint.org/docs/rules/no-restricted-properties
    'no-restricted-properties': [
      'error',
      {
        property: '__defineGetter__',
        message: 'Please use Object.defineProperty instead.',
      },
    ],
    // https://eslint.org/docs/rules/no-return-assign
    'no-return-assign': ['error', 'except-parens'],
    // https://eslint.org/docs/rules/no-return-await
    'no-return-await': 'off',
    // https://eslint.org/docs/rules/no-script-url
    'no-script-url': 'error',
    // https://eslint.org/docs/rules/no-self-assign
    'no-self-assign': ['error', { props: true }],
    // https://eslint.org/docs/rules/no-self-compare
    'no-self-compare': 'error',
    // https://eslint.org/docs/rules/no-sequences
    // @BUG conflict with prettier
    'no-sequences': 'off',
    // 'no-sequences': 'error',
    // https://eslint.org/docs/rules/no-throw-literal
    'no-throw-literal': 'error',
    // https://eslint.org/docs/rules/no-unmodified-loop-condition
    'no-unmodified-loop-condition': 'error',
    // https://eslint.org/docs/rules/no-unused-expressions
    'no-unused-expressions': 'off',
    '@babel/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: false,
        allowTaggedTemplates: true,
      },
    ],
    // https://eslint.org/docs/rules/no-unused-labels
    'no-unused-labels': 'error',
    // https://eslint.org/docs/rules/no-useless-call
    'no-useless-call': 'error',
    // https://eslint.org/docs/rules/no-useless-catch
    'no-useless-catch': 'error',
    // https://eslint.org/docs/rules/no-useless-concat
    'no-useless-concat': 'error',
    // https://eslint.org/docs/rules/no-useless-escape
    'no-useless-escape': 'error',
    // https://eslint.org/docs/rules/no-useless-return
    'no-useless-return': 'error',
    // https://eslint.org/docs/rules/no-void
    'no-void': 'error',
    // https://eslint.org/docs/rules/no-warning-comments
    'no-warning-comments': [
      'error',
      {
        terms: ['@TEMP'],
        location: 'anywhere',
      },
    ],
    // https://eslint.org/docs/rules/no-with
    'no-with': 'error',
    // https://eslint.org/docs/rules/prefer-named-capture-group
    'prefer-named-capture-group': 'off',
    // https://eslint.org/docs/rules/prefer-promise-reject-errors
    'prefer-promise-reject-errors': 'error',
    // https://eslint.org/docs/rules/radix
    radix: 'error',
    // https://eslint.org/docs/rules/require-await
    'require-await': 'off',
    // https://eslint.org/docs/rules/require-unicode-regexp
    'require-unicode-regexp': 'off',
    // https://eslint.org/docs/rules/vars-on-top
    'vars-on-top': 'off',
    // https://eslint.org/docs/rules/wrap-iife
    'wrap-iife': ['error', 'inside'],
    // https://eslint.org/docs/rules/yoda
    yoda: 'off',

    /*
     * Strict Mode
     * https://eslint.org/docs/rules/strict
     */
    strict: ['error', 'never'],

    /*
     * Variables
     * https://eslint.org/docs/rules/init-declarations
     */
    'init-declarations': 'off',
    // https://eslint.org/docs/rules/no-delete-var
    'no-delete-var': 'error',
    // https://eslint.org/docs/rules/no-label-var
    'no-label-var': 'error',
    // https://eslint.org/docs/rules/no-restricted-globals
    'no-restricted-globals': [
      'error',
      // @CUSTOM
    ],

    /*
     * https://eslint.org/docs/rules/no-shadow
     * "no-shadow": "off",
     */
    'no-shadow': [
      'error',
      {
        builtinGlobals: false,
        allow: [],
      },
    ],
    // https://eslint.org/docs/rules/no-shadow-restricted-names
    'no-shadow-restricted-names': 'error',
    // https://eslint.org/docs/rules/no-undef
    'no-undef': 'error',
    // https://eslint.org/docs/rules/no-undef-init
    'no-undef-init': 'error',
    // https://eslint.org/docs/rules/no-undefined
    'no-undefined': 'off',
    // https://eslint.org/docs/rules/no-unused-vars
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      },
    ],
    // https://eslint.org/docs/rules/no-use-before-define
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false,
        variables: false,
      },
    ],
    // https://eslint.org/docs/rules/no-sync
    'no-sync': 'off',

    /*
     * Stylistic Issues
     * https://eslint.org/docs/rules/array-bracket-newline
     */
    'array-bracket-newline': ['error', 'consistent'],
    // https://eslint.org/docs/rules/array-bracket-spacing
    'array-bracket-spacing': ['error', 'never'],
    // https://eslint.org/docs/rules/array-element-newline
    'array-element-newline': ['error', 'consistent'],
    // https://eslint.org/docs/rules/block-spacing
    'block-spacing': ['error', 'always'],
    // https://eslint.org/docs/rules/brace-style
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    // https://eslint.org/docs/rules/camelcase
    camelcase: [
      'error',
      {
        properties: 'never',
        allow: ['^UNSAFE_'],
      },
    ],
    // https://eslint.org/docs/rules/capitalized-comments
    'capitalized-comments': 'off',
    // https://eslint.org/docs/rules/comma-dangle
    'comma-dangle': ['error', 'always-multiline'],
    // https://eslint.org/docs/rules/comma-spacing
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    // https://eslint.org/docs/rules/comma-style
    'comma-style': ['error', 'last'],
    // https://eslint.org/docs/rules/computed-property-spacing
    'computed-property-spacing': ['error', 'never'],
    // https://eslint.org/docs/rules/consistent-this
    'consistent-this': ['error', 'self'],
    // https://eslint.org/docs/rules/eol-last
    'eol-last': ['error', 'always'],
    // https://eslint.org/docs/rules/func-call-spacing
    'func-call-spacing': ['error', 'never'],
    // https://eslint.org/docs/rules/func-name-matching
    'func-name-matching': [
      'error',
      'always',
      { considerPropertyDescriptor: true },
    ],

    /*
     * https://eslint.org/docs/rules/func-names
     * "func-names": [
     *   "error",
     *   "as-needed"
     * ],
     * https://eslint.org/docs/rules/func-style
     * "func-style": [
     *   "error",
     *   "expression"
     * ],
     * https://eslint.org/docs/rules/function-paren-newline
     */
    'function-paren-newline': ['error', 'multiline'],
    // https://eslint.org/docs/rules/id-blacklist
    'id-blacklist': [
      'error',
      // @CUSTOM
    ],
    // https://eslint.org/docs/rules/id-length
    'id-length': 'off',
    // https://eslint.org/docs/rules/id-match
    'id-match': 'off',
    // https://eslint.org/docs/rules/implicit-arrow-linebreak
    'implicit-arrow-linebreak': ['error', 'beside'],
    // https://eslint.org/docs/rules/indent
    indent: [
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
    // https://eslint.org/docs/rules/jsx-quotes
    'jsx-quotes': ['error', 'prefer-double'],
    // https://eslint.org/docs/rules/key-spacing
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      },
    ],
    // https://eslint.org/docs/rules/keyword-spacing
    'keyword-spacing': [
      'error',
      {
        before: true,
        after: true,
      },
    ],
    // https://eslint.org/docs/rules/line-comment-position
    'line-comment-position': 'off',
    // https://eslint.org/docs/rules/linebreak-style
    'linebreak-style': ['error', 'unix'],
    // https://eslint.org/docs/rules/lines-around-comment
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
        allowBlockStart: true,
        allowBlockEnd: false,
        allowClassStart: true,
        allowClassEnd: false,
        allowObjectStart: true,
        allowObjectEnd: false,
        allowArrayStart: true,
        allowArrayEnd: false,
      },
    ],
    // https://eslint.org/docs/rules/lines-between-class-members
    'lines-between-class-members': ['error', 'always'],
    // https://eslint.org/docs/rules/max-depth
    'max-depth': ['warn', 4],

    /*
     * https://eslint.org/docs/rules/max-len
     * https://github.com/prettier/eslint-config-prettier#max-len
     */
    'max-len': [
      'error',
      {
        code: 80,
        tabWidth: 4,
        ignoreComments: true,
        ignoreTrailingComments: false,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
      },
    ],
    // https://eslint.org/docs/rules/max-lines
    'max-lines': [
      'warn',
      {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    // https://eslint.org/docs/rules/max-lines-per-function
    'max-lines-per-function': 'off',

    /*
     * 'max-lines-per-function': [
     *   'error',
     *   {
     *     max: 50,
     *     skipBlankLines: true,
     *     skipComments: true,
     *     IIFEs: true,
     *   },
     * ],
     * https://eslint.org/docs/rules/max-nested-callbacks
     */
    'max-nested-callbacks': ['warn', 4],
    // https://eslint.org/docs/rules/max-params
    'max-params': ['warn', 4],
    // https://eslint.org/docs/rules/max-statements
    'max-statements': ['warn', 20],
    // https://eslint.org/docs/rules/max-statements-per-line
    'max-statements-per-line': ['error', { max: 1 }],
    // https://eslint.org/docs/rules/multiline-comment-style
    // @TODO bug:
    // // class Foo {
    // //  bar(){}
    // //  baz(){}
    // // }
    // ->
    // /*
    //  * class Foo {
    //  *   bar(){}
    //  *   baz(){}
    //  * }
    //  */
    'multiline-comment-style': 'off',
    // 'multiline-comment-style': ['error', 'starred-block'],
    // https://eslint.org/docs/rules/multiline-ternary
    'multiline-ternary': ['error', 'always-multiline'],
    // https://eslint.org/docs/rules/new-cap
    'new-cap': [
      'error',
      {
        newIsCap: true,
        capIsNew: false,
        properties: true,
      },
    ],
    '@babel/new-cap': 'off',
    // https://eslint.org/docs/rules/new-parens
    'new-parens': 'error',
    // https://eslint.org/docs/rules/newline-per-chained-call
    'newline-per-chained-call': 'off',
    // https://eslint.org/docs/rules/no-array-constructor
    'no-array-constructor': 'error',
    // https://eslint.org/docs/rules/no-bitwise
    'no-bitwise': 'error',
    // https://eslint.org/docs/rules/no-continue
    'no-continue': 'off',
    // https://eslint.org/docs/rules/no-inline-comments
    'no-inline-comments': 'off',
    // https://eslint.org/docs/rules/no-lonely-if
    'no-lonely-if': 'error',
    // https://eslint.org/docs/rules/no-mixed-operators
    'no-mixed-operators': 'off',
    // https://eslint.org/docs/rules/no-mixed-spaces-and-tabs
    'no-mixed-spaces-and-tabs': 'error',
    // https://eslint.org/docs/rules/no-multi-assign
    'no-multi-assign': 'error',
    // https://eslint.org/docs/rules/no-multiple-empty-lines
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxEOF: 1,
        maxBOF: 1,
      },
    ],
    // https://eslint.org/docs/rules/no-negated-condition
    'no-negated-condition': 'off',
    // https://eslint.org/docs/rules/no-nested-ternary
    'no-nested-ternary': 'error',
    // https://eslint.org/docs/rules/no-new-object
    'no-new-object': 'error',
    // https://eslint.org/docs/rules/no-plusplus
    'no-plusplus': 'off',

    /*
     * "no-plusplus": [
     *   "error",
     *   {
     *     "allowForLoopAfterthoughts": true
     *   }
     * ],
     * https://eslint.org/docs/rules/no-restricted-syntax
     */
    'no-restricted-syntax': 'off',
    // https://eslint.org/docs/rules/no-tabs
    'no-tabs': 'error',
    // https://eslint.org/docs/rules/no-ternary
    'no-ternary': 'off',
    // https://eslint.org/docs/rules/no-trailing-spaces
    'no-trailing-spaces': [
      'error',
      {
        skipBlankLines: false,
        ignoreComments: false,
      },
    ],
    // https://eslint.org/docs/rules/no-underscore-dangle
    'no-underscore-dangle': 'off',

    /*
     * "no-underscore-dangle": [
     *   "error",
     *   {
     *     "allowAfterThis": true,
     *     "allowAfterSuper": true,
     *     "enforceInMethodNames": true
     *   }
     * ],
     * https://eslint.org/docs/rules/no-unneeded-ternary
     */
    'no-unneeded-ternary': ['error', { defaultAssignment: true }],
    // https://eslint.org/docs/rules/no-whitespace-before-property
    'no-whitespace-before-property': 'error',
    // https://eslint.org/docs/rules/nonblock-statement-body-position
    'nonblock-statement-body-position': ['error', 'below'],
    // https://eslint.org/docs/rules/object-curly-newline
    'object-curly-newline': ['error', { multiline: true }],
    // https://eslint.org/docs/rules/object-curly-spacing
    'object-curly-spacing': ['error', 'always'],
    '@babel/object-curly-spacing': 'off',
    // https://eslint.org/docs/rules/object-property-newline
    'object-property-newline': 'off',
    // https://eslint.org/docs/rules/one-var
    'one-var': [
      'error',
      {
        // var: 'consecutive',
        // let: 'consecutive',
        // const: 'consecutive',
        // separateRequires: true,
        initialized: 'never',
        uninitialized: 'consecutive',
      },
    ],
    // https://eslint.org/docs/rules/one-var-declaration-per-line
    'one-var-declaration-per-line': ['error', 'initializations'],
    // https://eslint.org/docs/rules/operator-assignment
    'operator-assignment': ['error', 'always'],
    // https://eslint.org/docs/rules/operator-linebreak
    'operator-linebreak': ['error', 'before'],
    // https://eslint.org/docs/rules/padded-blocks
    'padded-blocks': [
      'error',
      {
        blocks: 'never',
        classes: 'always',
        switches: 'never',
      },
    ],
    // https://eslint.org/docs/rules/padding-line-between-statements
    'padding-line-between-statements': 'off',
    // https://eslint.org/docs/rules/prefer-object-spread
    'prefer-object-spread': 'error',
    // https://eslint.org/docs/rules/quote-props
    'quote-props': ['error', 'as-needed'],
    // https://eslint.org/docs/rules/quotes
    quotes: [
      'error',
      'single',
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    // https://eslint.org/docs/rules/semi
    semi: ['error', 'always'],
    '@babel/semi': 'off',
    // https://eslint.org/docs/rules/semi-spacing
    'semi-spacing': 'error',
    // https://eslint.org/docs/rules/semi-style
    'semi-style': ['error', 'last'],
    // https://eslint.org/docs/rules/sort-keys
    'sort-keys': 'off',
    // https://eslint.org/docs/rules/sort-vars
    'sort-vars': 'off',
    // https://eslint.org/docs/rules/space-before-blocks
    'space-before-blocks': 'error',
    // https://eslint.org/docs/rules/space-before-function-paren
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    // https://eslint.org/docs/rules/space-in-parens
    'space-in-parens': ['error', 'never'],
    // https://eslint.org/docs/rules/space-infix-ops
    'space-infix-ops': 'error',
    // https://eslint.org/docs/rules/space-unary-ops
    'space-unary-ops': [
      'error',
      {
        words: true,
        nonwords: false,
      },
    ],
    // https://eslint.org/docs/rules/spaced-comment
    'spaced-comment': [
      'error',
      'always',
      {
        line: {
          markers: ['/', '!'],
          exceptions: ['-', '+', '-+', '=', '*'],
        },
        block: {
          markers: ['/', '!'],
          exceptions: ['-', '+', '-+', '=', '*'],
          balanced: true,
        },
      },
    ],
    // https://eslint.org/docs/rules/switch-colon-spacing
    'switch-colon-spacing': 'error',
    // https://eslint.org/docs/rules/template-tag-spacing
    'template-tag-spacing': ['error', 'never'],
    // https://eslint.org/docs/rules/unicode-bom
    'unicode-bom': 'error',
    // https://eslint.org/docs/rules/wrap-regex
    'wrap-regex': 'off',

    /*
     * ECMAScript 6
     * https://eslint.org/docs/rules/arrow-body-style
     */
    'arrow-body-style': ['error', 'as-needed'],
    // https://eslint.org/docs/rules/arrow-parens
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    // https://eslint.org/docs/rules/arrow-spacing
    'arrow-spacing': 'error',
    // https://eslint.org/docs/rules/constructor-super
    'constructor-super': 'error',
    // https://eslint.org/docs/rules/generator-star-spacing
    'generator-star-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    // https://eslint.org/docs/rules/no-class-assign
    'no-class-assign': 'error',
    // https://eslint.org/docs/rules/no-confusing-arrow
    'no-confusing-arrow': 'off',

    /*
     * "no-confusing-arrow": [
     *   "error",
     *   {
     *     "allowParens": true
     *   }
     * ],
     * https://eslint.org/docs/rules/no-const-assign
     */
    'no-const-assign': 'error',
    // https://eslint.org/docs/rules/no-dupe-class-members
    'no-dupe-class-members': 'error',
    // https://eslint.org/docs/rules/no-duplicate-imports
    // @bug 支持 TypeScript 3.8 新语法
    // no-duplicate-imports，不允许一个引用存在多个引用。由于 import type 和 import 存在行为差异，不能放到一个 import 里面进行，因此就会产生两个 import
    'no-duplicate-imports': 'off',
    // 'no-duplicate-imports': [
    //   'error',
    //   {
    //     includeExports: true,
    //   },
    // ],
    // https://eslint.org/docs/rules/no-new-symbol
    'no-new-symbol': 'error',
    // https://eslint.org/docs/rules/no-restricted-imports
    'no-restricted-imports': [
      'error',
      // @CUSTOM
    ],
    // https://eslint.org/docs/rules/no-this-before-super
    'no-this-before-super': 'error',
    // https://eslint.org/docs/rules/no-useless-computed-key
    'no-useless-computed-key': 'error',
    // https://eslint.org/docs/rules/no-useless-constructor
    'no-useless-constructor': 'error',
    // https://eslint.org/docs/rules/no-useless-rename
    'no-useless-rename': 'error',
    // https://eslint.org/docs/rules/no-var
    'no-var': 'error',
    // https://eslint.org/docs/rules/object-shorthand
    'object-shorthand': ['error', 'always'],
    // https://eslint.org/docs/rules/prefer-arrow-callback
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
    // https://eslint.org/docs/rules/prefer-const
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: true,
      },
    ],
    // https://eslint.org/docs/rules/prefer-destructuring
    'prefer-destructuring': [
      'error',
      {
        array: false,
        object: true,
      },
      { enforceForRenamedProperties: false },
    ],
    // https://eslint.org/docs/rules/prefer-numeric-literals
    'prefer-numeric-literals': 'error',
    // https://eslint.org/docs/rules/prefer-rest-params
    'prefer-rest-params': 'error',
    // https://eslint.org/docs/rules/prefer-spread
    'prefer-spread': 'error',
    // https://eslint.org/docs/rules/prefer-template
    'prefer-template': 'error',
    // https://eslint.org/docs/rules/require-yield
    'require-yield': 'error',
    // https://eslint.org/docs/rules/rest-spread-spacing
    'rest-spread-spacing': ['error', 'never'],

    /*
     * https://eslint.org/docs/rules/sort-imports
     * prefer import/order
     */
    'sort-imports': 'off',
    // https://eslint.org/docs/rules/symbol-description
    'symbol-description': 'error',
    // https://eslint.org/docs/rules/template-curly-spacing
    'template-curly-spacing': ['error', 'never'],
    // https://eslint.org/docs/rules/yield-star-spacing
    'yield-star-spacing': ['error', 'after'],
    // https://eslint.org/docs/rules/function-call-argument-newline
    'function-call-argument-newline': ['error', 'consistent'],

    /*
     * prettier
     * https://github.com/prettier/prettier#options
     */
    'prettier/prettier': [
      'error',
      {
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        jsxBracketSameLine: true,
        arrowParens: 'avoid',
        endOfLine: 'auto',
      },
    ],

    /*
     * react
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/boolean-prop-naming.md
     */
    'react/boolean-prop-naming': [
      'error',
      {
        propTypeNames: ['bool'],
        rule: '^(is|has|should)[A-Z]([A-Za-z0-9]?)+',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/button-has-type.md
    'react/button-has-type': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/default-props-match-prop-types.md
    'react/default-props-match-prop-types': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
    'react/destructuring-assignment': [
      'error',
      'always',
      { ignoreClassFields: true },
    ],

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/display-name.md
     * @TODO
     * @TIPS
     * for stateless component: use named function for now
     * const Dialog = ({ children }) => (
     *   <div className="dialog">{children}</div>
     * )
     * ->
     * const Dialog = function Dialog({ children }) {
     *   return (
     *     <div className="dialog">{children}</div>
     *   )
     * }
     * issues:
     * https://github.com/yannickcr/eslint-plugin-react/issues/1297
     * https://github.com/yannickcr/eslint-plugin-react/issues/412
     * feedback:
     * - 把一个render 作为props传入组件还是比较常见的
     * - 嗯ok，这个规则现在的性价比是不太高了…
     */
    'react/display-name': 'off',
    // 'react/display-name': [
    //   'error',
    //   {
    //     ignoreTranspilerName: false,
    //   },
    // ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/forbid-component-props.md
    'react/forbid-component-props': 'off',

    /*
     * @CUSTOM
     * "react/forbid-component-props": [
     *   "error",
     *   {
     *     "forbid": [
     *       "className",
     *       "style"
     *     ]
     *   }
     * ],
     * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/forbid-dom-props.md
     */
    'react/forbid-dom-props': 'off',

    /*
     * @CUSTOM
     * "react/forbid-dom-props": [
     *   "error",
     *   {
     *     "forbid": []
     *   }
     * ],
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/forbid-elements.md
     */
    'react/forbid-elements': 'off',

    /*
     * @CUSTOM
     * "react/forbid-elements": [
     *   "error",
     *   {
     *     "forbid": [
     *       {
     *         "element": "button",
     *         "message": "use <Button> instead"
     *       }
     *     ]
     *   }
     * ],
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/forbid-prop-types.md
     */
    'react/forbid-prop-types': 'off',

    /*
     * @CUSTOM
     * "react/forbid-prop-types": [
     *   "error",
     *   {
     *     "forbid": [],
     *     "allowInPropTypes": []
     *   }
     * ],
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/forbid-foreign-prop-types.md
     */
    'react/forbid-foreign-prop-types': 'error',

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-access-state-in-setstate.md
     * @TIPS
     * this.setState({value: this.state.value + 1});
     * ->
     * this.setState(prevState => ({value: prevState.value + 1}));
     */
    'react/no-access-state-in-setstate': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-array-index-key.md
    'react/no-array-index-key': 'warn',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-children-prop.md
    'react/no-children-prop': 'error',

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-danger.md
     * @TIPS
     * explicitly declare `eslint-disable` when truly necessary
     */
    'react/no-danger': 'error',

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-danger-with-children.md
     * @TIPS
     * explicitly declare `eslint-disable` when truly necessary
     */
    'react/no-danger-with-children': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-deprecated.md
    'react/no-deprecated': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-did-mount-set-state.md
    'react/no-did-mount-set-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-did-update-set-state.md
    'react/no-did-update-set-state': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-direct-mutation-state.md
    'react/no-direct-mutation-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-find-dom-node.md
    'react/no-find-dom-node': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-is-mounted.md
    'react/no-is-mounted': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-multi-comp.md
    'react/no-multi-comp': ['error', { ignoreStateless: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-redundant-should-component-update.md
    'react/no-redundant-should-component-update': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-render-return-value.md
    'react/no-render-return-value': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-set-state.md
    'react/no-set-state': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-typos.md
    'react/no-typos': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-string-refs.md
    'react/no-string-refs': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-this-in-sfc.md
    'react/no-this-in-sfc': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-unescaped-entities.md
    'react/no-unescaped-entities': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-unknown-property.md
    'react/no-unknown-property': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unsafe.md
    'react/no-unsafe': ['error', { checkAliases: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-unused-prop-types.md
    'react/no-unused-prop-types': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-will-update-set-state.md
    'react/no-will-update-set-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/prefer-es6-class.md
    'react/prefer-es6-class': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/prefer-stateless-function.md
    'react/prefer-stateless-function': [
      'error',
      { ignorePureComponents: false },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/prop-types.md
    'react/prop-types': [
      'error',
      {
        skipUndeclared: true,
        ignore: ['children', 'className'],
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/react-in-jsx-scope.md
    // react 17
    'react/react-in-jsx-scope': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/require-default-props.md
    'react/require-default-props': [
      'error',
      { forbidDefaultForRequired: true },
    ],

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/require-optimization.md
     * https://github.com/facebook/react/pull/7195#issuecomment-236361372
     * https://hackernoon.com/react-purecomponent-considered-harmful-8155b5c1d4bc
     */
    'react/require-optimization': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/require-render-return.md
    'react/require-render-return': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/self-closing-comp.md
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: false,
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/sort-comp.md
    'react/sort-comp': [
      'error',
      {
        order: [
          'type-annotations',
          'class-properties-and-methods',
          'instance-variables',
          'state',
          'getInitialState',
          'getChildContext',
          'getDefaultProps',
          'constructor',
          'lifecycle',
          '/^is.+$/',
          '/^_is.+$/',
          '/^has.+$/',
          '/^_has.+$/',
          '/^should.+$/',
          '/^_should.+$/',
          '/^get.+$/',
          '/^_get.+$/',
          'getters',
          '/^set.+$/',
          '/^_set.+$/',
          'setters',
          '/^on.+$/',
          '/^_on.+$/',
          '/^handle.+$/',
          '/^_handle.+$/',
          'instance-methods',
          'everything-else',
          'rendering',
        ],
        groups: {
          'class-properties-and-methods': [
            'displayName',
            'propTypes',
            'contextTypes',
            'childContextTypes',
            'mixins',
            'statics',
            'defaultProps',
            'getDerivedStateFromProps',
            'static-methods',
          ],
          lifecycle: [
            'UNSAFE_componentWillMount',
            'componentWillMount',
            'componentDidMount',
            'UNSAFE_componentWillReceiveProps',
            'componentWillReceiveProps',
            'shouldComponentUpdate',
            'getSnapshotBeforeUpdate',
            'UNSAFE_componentWillUpdate',
            'componentWillUpdate',
            'componentDidUpdate',
            'componentWillUnmount',
          ],
          rendering: ['/^render.+$/', 'render'],
        },
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/sort-prop-types.md
    'react/sort-prop-types': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/style-prop-object.md
    'react/style-prop-object': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/void-dom-elements-no-children.md
    'react/void-dom-elements-no-children': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-boolean-value.md
    'react/jsx-boolean-value': ['error', 'always'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-child-element-spacing.md
    'react/jsx-child-element-spacing': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-bracket-location.md
    'react/jsx-closing-bracket-location': [
      'error',
      {
        // "selfClosing": "props-aligned",
        selfClosing: 'after-props',
        // "nonEmpty": "props-aligned"
        nonEmpty: 'after-props',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-closing-tag-location.md
    'react/jsx-closing-tag-location': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-spacing.md
    'react/jsx-curly-spacing': ['error', { when: 'never' }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-equals-spacing.md
    'react/jsx-equals-spacing': ['error', 'never'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-filename-extension.md
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.jsx', '.tsx', '.mjsx', '.cjsx'] },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-first-prop-new-line.md
    'react/jsx-first-prop-new-line': ['error', 'multiline'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-handler-names.md
    'react/jsx-handler-names': [
      'error',
      {
        eventHandlerPrefix: '',
        // eventHandlerPrefix: 'handle',
        eventHandlerPropPrefix: 'on',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent.md
    'react/jsx-indent': ['error', 2],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-indent-props.md
    'react/jsx-indent-props': ['error', 2],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-key.md
    'react/jsx-key': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-depth.md
    'react/jsx-max-depth': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-max-props-per-line.md
    'react/jsx-max-props-per-line': [
      'error',
      {
        maximum: 1,
        when: 'always',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md
    'react/jsx-no-bind': [
      'error',
      {
        ignoreRefs: true,
        allowArrowFunctions: true,
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-comment-textnodes.md
    'react/jsx-no-comment-textnodes': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-duplicate-props.md
    'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-literals.md
    'react/jsx-no-literals': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-target-blank.md
    'react/jsx-no-target-blank': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-undef.md
    'react/jsx-no-undef': ['error', { allowGlobals: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-one-expression-per-line.md
    'react/jsx-one-expression-per-line': ['error', { allow: 'single-child' }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-brace-presence.md
    'react/jsx-curly-brace-presence': 'off',

    /*
     * "react/jsx-curly-brace-presence": [
     *   "error",
     *   "never"
     * ],
     * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-fragments.md
     * @TODO bug
     */
    'react/jsx-fragments': 'off', // ['error', 'syntax'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
    'react/jsx-pascal-case': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-multi-spaces.md
    'react/jsx-props-no-multi-spaces': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-default-props.md
    'react/jsx-sort-default-props': 'off',

    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-sort-props.md
     * @TODO bug: conflict with prettier
     */
    'react/jsx-sort-props': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-tag-spacing.md
    'react/jsx-tag-spacing': [
      'error',
      {
        closingSlash: 'never',
        beforeSelfClosing: 'always',
        afterOpening: 'never',
        beforeClosing: 'never',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-uses-react.md
    // react 17
    'react/jsx-uses-react': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-uses-vars.md
    'react/jsx-uses-vars': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-wrap-multilines.md
    'react/jsx-wrap-multilines': [
      'error',
      {
        declaration: true,
        assignment: true,
        return: true,
        arrow: true,
        condition: 'parens-new-line',
        logical: 'parens-new-line',
        prop: 'parens-new-line',
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-state.md
    'react/no-unused-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-props-no-spreading.md
    'react/jsx-props-no-spreading': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/prefer-read-only-props.md
    'react/prefer-read-only-props': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/state-in-constructor.md
    'react/state-in-constructor': ['error', 'never'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/static-property-placement.md
    'react/static-property-placement': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-curly-newline.md
    'react/jsx-curly-newline': [
      'error',
      { multiline: 'require', singleline: 'forbid' },
    ],
    // https://reactjs.org/docs/hooks-rules.html
    'react-hooks/rules-of-hooks': 'error',
    // https://github.com/facebook/react/issues/16006
    'react-hooks/exhaustive-deps': 'off',

    /*
     * import
     * Static analysis
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unresolved.md
     */
    'import/no-unresolved': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/named.md
    // @bug
    'import/named': 'off',
    // 'import/named': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/default.md
    'import/default': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/namespace.md
    'import/namespace': ['error', { allowComputed: true }],
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-restricted-paths.md
    'import/no-restricted-paths': 'warn',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-absolute-path.md
    'import/no-absolute-path': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-dynamic-require.md
    'import/no-dynamic-require': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-internal-modules.md
    'import/no-internal-modules': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unused-modules.md
    // @BUG
    'import/no-unused-modules': 'off',
    // 'import/no-unused-modules': [
    //   'error',
    //   {
    //     missingExports: false,
    //     unusedExports: true,
    //   },
    // ],
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-webpack-loader-syntax.md
    'import/no-webpack-loader-syntax': 'off',

    /*
     * Helpful warnings
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/export.md
     */
    'import/export': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-as-default.md
    'import/no-named-as-default': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-as-default-member.md
    'import/no-named-as-default-member': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-deprecated.md
    'import/no-deprecated': 'warn',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-extraneous-dependencies.md
    'import/no-extraneous-dependencies': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-mutable-exports.md
    'import/no-mutable-exports': 'error',

    /*
     * Module systems
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/unambiguous.md
     */
    'import/unambiguous': 'off',

    /*
     * https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-commonjs.md
     * @TIPS
     * for the following 'require' usages:
     * 1. dynamic module path -
     *    explicitly declare `eslint-disable` when truly necessary
     * 2. dependencies determined at runtime -
     *    dynamic import,
     *    or es6 import + tree shaking,
     *    or explicitly declare `eslint-disable` when truly necessary
     * 3. side effect module -
     *    `import 'xxx'` (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only)
     * 4. async require or promise-loader -
     *    dynamic import (`import('xxx').then()`)
     * for 'modules.exports = jsonData' usage:
     * solutions:
     * #1: use JSON format
     * #2: use es6 export
     * export const wechatPayGray = 'xxxx'
     * #3: export named object
     * const iconPath = {
     *   wechatPayGray: 'xxxx',
     *   // ...
     * }
     * export default iconPath
     */
    'import/no-commonjs': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-amd.md
    'import/no-amd': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-nodejs-modules.md
    'import/no-nodejs-modules': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/first.md
    'import/first': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/exports-last.md
    'import/exports-last': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-duplicates.md
    'import/no-duplicates': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-namespace.md
    'import/no-namespace': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
    // @bug
    'import/extensions': 'off',
    // 'import/extensions': [
    //   'error',
    //   'always',
    //   {
    //     js: 'never',
    //     jsx: 'never',
    //     ts: 'never',
    //     tsx: 'never',
    //     mjs: 'never',
    //     mjsx: 'never',
    //     cjs: 'never',
    //     cjsx: 'never',
    //   },
    // ],
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'ignore',
      },
    ],
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/newline-after-import.md
    'import/newline-after-import': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/prefer-default-export.md
    'import/prefer-default-export': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/max-dependencies.md
    'import/max-dependencies': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-unassigned-import.md
    'import/no-unassigned-import': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-default.md
    'import/no-named-default': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-anonymous-default-export.md
    'import/no-anonymous-default-export': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/group-exports.md
    'import/group-exports': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-self-import.md
    'import/no-self-import': 'error',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-default-export.md
    'import/no-default-export': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-named-export.md
    'import/no-named-export': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-useless-path-segments.md
    'import/no-useless-path-segments': ['error', { noUselessIndex: true }],
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-cycle.md
    'import/no-cycle': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/dynamic-import-chunkname.md
    // @TODO
    'import/dynamic-import-chunkname': 'off',
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-relative-parent-imports.md
    // @BUG `import { createModel } from '@modern-js-reduck/core'` in monorepo
    'import/no-relative-parent-imports': 'off',
    // 'import/no-relative-parent-imports': 'error',
    // eslint-comments
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/disable-enable-pair.md
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: false }],
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-duplicate-disable.md
    'eslint-comments/no-duplicate-disable': 'error',

    /*
     * https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-unlimited-disable.md
     * @TIPS
     * move code into a dedicated directory with its own .eslintrc
     */
    'eslint-comments/no-unlimited-disable': 'error',
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-unused-disable.md
    'eslint-comments/no-unused-disable': 'error',
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-unused-enable.md
    'eslint-comments/no-unused-enable': 'error',
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-use.md
    'eslint-comments/no-use': [
      'error',
      {
        allow: [
          // 'eslint',
          'eslint-disable',
          'eslint-disable-line',
          'eslint-disable-next-line',
          'eslint-enable',
          'eslint-env',
          // "exported",
          // "global",
          // "globals",
        ],
      },
    ],
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-aggregating-enable.md
    'eslint-comments/no-aggregating-enable': 'error',
    // https://github.com/mysticatea/eslint-plugin-eslint-comments/blob/HEAD/docs/rules/no-restricted-disable.md
    'eslint-comments/no-restricted-disable': 'off',

    /*
     * filenames
     * https://www.npmjs.com/package/eslint-plugin-filenames#consistent-filenames-via-regex-match-regex
     * @TIPS
     * use Pascal Case for class and react component
     * use Camel Case for others
     */
    'filenames/match-regex': ['error', '^[\\[\\]_a-zA-Z0-9.-]+$'],
    // https://www.npmjs.com/package/eslint-plugin-filenames#matching-exported-values-match-exported
    'filenames/match-exported': ['error', ['kebab', 'camel', 'pascal']],
    // https://www.npmjs.com/package/eslint-plugin-filenames#dont-allow-indexjs-files-no-index
    'filenames/no-index': 'off',

    /*
     * promise
     * https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/catch-or-return.md
     */
    'promise/catch-or-return': 'off',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-return-wrap.md
    'promise/no-return-wrap': 'error',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/param-names.md
    'promise/param-names': 'error',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/always-return.md
    'promise/always-return': 'off',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-native.md
    'promise/no-native': 'off',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-nesting.md
    'promise/no-nesting': 'warn',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-promise-in-callback.md
    'promise/no-promise-in-callback': 'warn',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-callback-in-promise.md
    'promise/no-callback-in-promise': 'off',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/avoid-new.md
    'promise/avoid-new': 'off',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/no-new-statics.md
    'promise/no-new-statics': 'error',
    // https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/valid-params.md
    'promise/valid-params': 'error',

    /*
     * https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/prefer-await-to-then.md
     * @CUSTOM
     */
    'promise/prefer-await-to-then': 'error',

    /*
     * https://github.com/xjamundx/eslint-plugin-promise/blob/master/docs/rules/prefer-await-to-callbacks.md
     * @CUSTOM
     */
    'promise/prefer-await-to-callbacks': 'off',

    /*
     * node
     */
    // https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-restricted-import.md
    'node/no-restricted-import': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/no-exports-assign.md
    'node/no-exports-assign': 'error',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-extraneous-import.md
    'node/no-extraneous-import': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-extraneous-require.md
    'node/no-extraneous-require': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-missing-import.md
    'node/no-missing-import': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-missing-require.md
    'node/no-missing-require': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-unpublished-import.md
    'node/no-unpublished-import': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-unpublished-require.md
    'node/no-unpublished-require': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-unpublished-bin.md
    'node/no-unpublished-bin': 'error',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/no-unsupported-features/es-builtins.md
    'node/no-unsupported-features/es-builtins': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/no-unsupported-features/es-syntax.md
    'node/no-unsupported-features/es-syntax': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/no-unsupported-features/node-builtins.md
    'node/no-unsupported-features/node-builtins': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/prefer-global/process.md
    'node/prefer-global/process': ['error', 'always'],
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/prefer-global/console.md
    'node/prefer-global/console': ['error', 'always'],
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/prefer-global/url.md
    'node/prefer-global/url': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/prefer-global/url-search-params.md
    'node/prefer-global/url-search-params': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v7.0.0/docs/rules/prefer-global/buffer.md
    'node/prefer-global/buffer': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/prefer-global/text-decoder.md
    'node/prefer-global/text-decoder': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/prefer-global/text-encoder.md
    'node/prefer-global/text-encoder': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/process-exit-as-throw.md
    'node/process-exit-as-throw': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/shebang.md
    'node/shebang': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/no-deprecated-api.md
    'node/no-deprecated-api': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/HEAD/docs/rules/exports-style.md
    'node/exports-style': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/master/docs/rules/file-extension-in-import.md
    'node/file-extension-in-import': [
      'error',
      'always',
      {
        '.js': 'never',
        '.jsx': 'never',
        '.ts': 'never',
        '.d.ts': 'never',
        '.tsx': 'never',
        '.mjs': 'never',
        '.mjsx': 'never',
        '.cjs': 'never',
        '.cjsx': 'never',
        tryExtensions: [...jsExtensions, '.json', '.node'],
      },
    ],
    // https://github.com/mysticatea/eslint-plugin-node/blob/v9.0.0/docs/rules/prefer-promises/dns.md
    'node/prefer-promises/dns': 'off',
    // https://github.com/mysticatea/eslint-plugin-node/blob/v9.0.0/docs/rules/prefer-promises/fs.md
    'node/prefer-promises/fs': 'off',

    /*
     * JSDoc
     * @TIPS
     * if your block comments are not JSDoc,
     * change `/**` into `/*`
     * https://github.com/gajus/eslint-plugin-jsdoc#check-alignment
     */
    // 'jsdoc/check-alignment': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-examples
    // 'jsdoc/check-examples': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-indentation
    // 'jsdoc/check-indentation': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-param-names
    // 'jsdoc/check-param-names': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-syntax
    // 'jsdoc/check-syntax': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-tag-names
    // 'jsdoc/check-tag-names': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#check-types
    // 'jsdoc/check-types': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#implements-on-classes
    // 'jsdoc/implements-on-classes': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#match-description
    // 'jsdoc/match-description': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#newline-after-description
    // 'jsdoc/newline-after-description': ['error', 'always'],
    // // https://github.com/gajus/eslint-plugin-jsdoc#no-types
    // 'jsdoc/no-types': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#no-undefined-types
    // 'jsdoc/no-undefined-types': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-description-complete-sentence
    // 'jsdoc/require-description-complete-sentence': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-description
    // 'jsdoc/require-description': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-example
    // 'jsdoc/require-example': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-hyphen-before-param-description
    // 'jsdoc/require-hyphen-before-param-description': ['error', 'always'],
    // // https://github.com/gajus/eslint-plugin-jsdoc#eslint-plugin-jsdoc-rules-require-jsdoc
    // 'jsdoc/require-jsdoc': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-param-description
    // 'jsdoc/require-param-description': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-param-name
    // 'jsdoc/require-param-name': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-param-type
    // 'jsdoc/require-param-type': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-param
    // 'jsdoc/require-param': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-returns-check
    // 'jsdoc/require-returns-check': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-returns-description
    // 'jsdoc/require-returns-description': 'error',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-returns-type
    // 'jsdoc/require-returns-type': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#require-returns
    // 'jsdoc/require-returns': 'off',
    // // https://github.com/gajus/eslint-plugin-jsdoc#valid-types
    // 'jsdoc/valid-types': 'off',
  },
  settings: {
    'import/resolver': 'webpack',
    'import/extensions': jsExtensions,
    'import/ignore': ['\\.coffee$'],
    react: { version: '16.0' },
  },
  // https://eslint.org/docs/user-guide/configuring#configuration-based-on-glob-patterns
  // https://eslint.org/docs/user-guide/migrating-to-6.0.0#-overrides-in-an-extended-config-file-can-now-be-overridden-by-a-parent-config-file
  overrides: [
    {
      files: ['*.ts', '*.d.ts', '*.tsx'],

      /*
       * https://eslint.org/blog/2019/01/future-typescript-eslint
       * https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/parser
       */
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
        // createDefaultProgram: true,
        // project: 'node_modules/@modern/config/defaults/tsconfig.json',
        // tsconfigRootDir: path.resolve(
        //   path.dirname(require.resolve('eslint/package.json')),
        //   '../..',
        // ),
      },
      // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
      plugins: [
        '@typescript-eslint',
        // 'tsdoc'
      ],
      // @BUG
      // extends: ['plugin:@typescript-eslint/recommended'],
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/await-thenable.md
        '@typescript-eslint/await-thenable': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-for-in-array.md
        '@typescript-eslint/no-for-in-array': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules
        '@typescript-eslint/no-implicit-any-catch': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-invalid-void-type.md
        '@typescript-eslint/no-invalid-void-type': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-inferrable-types.md
        '@typescript-eslint/no-inferrable-types': [
          'error',
          { ignoreProperties: true },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-new.md
        '@typescript-eslint/no-misused-new': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-namespace.md
        '@typescript-eslint/no-namespace': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-base-to-string.md
        '@typescript-eslint/no-base-to-string': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-boolean-literal-compare.md
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-condition.md
        '@typescript-eslint/no-unnecessary-condition': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-qualifier.md
        '@typescript-eslint/no-unnecessary-qualifier': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-assertion.md
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-constraint.md
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unnecessary-type-constraint.md
        '@typescript-eslint/no-unsafe-assignment': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-call.md
        '@typescript-eslint/no-unsafe-call': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-member-access.md
        '@typescript-eslint/no-unsafe-member-access': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-unsafe-return.md
        '@typescript-eslint/no-unsafe-return': 'off',
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
        // https://github.com/typescript-eslint/typescript-eslint/pull/294
        '@typescript-eslint/prefer-includes': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-namespace-keyword.md
        '@typescript-eslint/prefer-namespace-keyword': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/pull/289
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-plus-operands.md
        '@typescript-eslint/restrict-plus-operands': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/restrict-template-expressions.md
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          { allowNumber: true, allowAny: true },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/switch-exhaustiveness-check.md
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unbound-method.md
        '@typescript-eslint/unbound-method': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/unified-signatures.md
        '@typescript-eslint/unified-signatures': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/func-call-spacing.md
        '@typescript-eslint/func-call-spacing': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-magic-numbers.md
        '@typescript-eslint/no-magic-numbers': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/semi.md
        '@typescript-eslint/semi': ['error', 'always'],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
        '@typescript-eslint/prefer-regexp-exec': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-function.md
        '@typescript-eslint/no-empty-function': ['error', { allow: [] }],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-floating-promises.md
        '@typescript-eslint/no-floating-promises': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/strict-boolean-expressions.md
        '@typescript-eslint/strict-boolean-expressions': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-readonly.md
        '@typescript-eslint/prefer-readonly': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-misused-promises.md
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: false },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/require-await.md
        '@typescript-eslint/require-await': 'off',
        // https://github.com/typescript-eslint/typescript-eslint/blob/55eb0cfac20ccbc2e954083dd554dbcfcbed64fb/packages/eslint-plugin/docs/rules/return-await.md
        'no-return-await': 'off',
        '@typescript-eslint/return-await': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin//docs/rules/no-unnecessary-type-arguments.md
        '@typescript-eslint/no-unnecessary-type-arguments': 'error',
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/dot-notation.md
        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
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
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-implied-eval.md
        'no-implied-eval': 'off',
        '@typescript-eslint/no-implied-eval': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-loop-func.md
        'no-loop-func': 'off',
        '@typescript-eslint/no-loop-func': 'error',
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-redeclare.md
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': ['error', { builtinGlobals: true }],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-shadow.md
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': [
          'error',
          {
            builtinGlobals: false,
            allow: [],
          },
        ],
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-throw-literal.md
        'no-throw-literal': 'off',
        '@typescript-eslint/no-throw-literal': 'error',
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
    {
      files: ['*.test.*', '*.spec.*', '**/__test__/**'],
      env: {
        mocha: true,
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
        '@babel/no-unused-expressions': 'off',
      },
    },
    {
      files: ['*.worker.*'],
      env: { worker: true },
    },
    {
      files: ['**/pages/**/_*', '**/pages/**/index.*', '**/pages/**/\\[**'],
      rules: {
        'filenames/match-regex': 'off',
        'filenames/match-exported': 'off',
      },
    },
    {
      files: ['*.stories.[tj]sx', '*.stories.[tj]s'],
      rules: { 'import/no-anonymous-default-export': 'off' },
    },
    {
      files: ['**/*.md'],
      processor: 'markdown/markdown',
    },
  ],
};
/* eslint-enable max-lines, no-magic-numbers */
