/* eslint-disable max-lines */
const { jsExtensions } = require('./utils');

module.exports = {
  ignorePatterns: ['**/node_modules/**', '**/dist/**'],
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  parserOptions: {
    ecmaVersion: 8,
    ecmaFeatures: {
      impliedStrict: true,
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
    commonjs: false,
    'shared-node-browser': true,
    browser: true,
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
    // https://www.npmjs.com/package/@babel/eslint-plugin
    '@babel',
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
    // https: //github.com/eslint/eslint-plugin-markdown
    'markdown',
  ],
  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  extends: [
    // https://eslint.org/docs/user-guide/configuring#using-eslintrecommended
    'eslint:recommended',
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
     * @TIPS: for non-VS Code users, please use `debugger // eslint-disable-line`
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
     * add comment to explain why we need a empty function/method here
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

    /*
     * https://eslint.org/docs/rules/max-nested-callbacks
     */
    'max-nested-callbacks': ['warn', 4],
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
     * https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
     */
    'prettier/prettier': 'error',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',

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
  },
  settings: {
    'import/extensions': jsExtensions,
    'import/ignore': ['\\.coffee$'],
  },
  // https://eslint.org/docs/user-guide/configuring#configuration-based-on-glob-patterns
  // https://eslint.org/docs/user-guide/migrating-to-6.0.0#-overrides-in-an-extended-config-file-can-now-be-overridden-by-a-parent-config-file
  overrides: [
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
    // ignore auto-generated css module declarations
    {
      files: ['*.css.d.ts'],
      rules: {
        'prettier/prettier': 'off',
      },
    },
  ],
};
/* eslint-enable max-lines */
