module.exports = {
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  // https://eslint.org/docs/user-guide/configuring#configuring-plugins
  plugins: [
    // https://www.npmjs.com/package/eslint-plugin-react
    'react',
    // https://www.npmjs.com/package/eslint-plugin-react-hooks
    'react-hooks',
  ],
  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime'],

  settings: {
    react: { version: '16.0' },
  },

  rules: {
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
    /*
     * https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-danger.md
     * @TIPS
     * explicitly declare `eslint-disable` when truly necessary
     */
    'react/no-danger': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-did-mount-set-state.md
    'react/no-did-mount-set-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-redundant-should-component-update.md
    'react/no-redundant-should-component-update': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-typos.md
    'react/no-typos': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-this-in-sfc.md
    'react/no-this-in-sfc': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unsafe.md
    'react/no-unsafe': ['error', { checkAliases: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-unused-prop-types.md
    'react/no-unused-prop-types': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/no-will-update-set-state.md
    'react/no-will-update-set-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/prefer-stateless-function.md
    'react/prefer-stateless-function': [
      'warn',
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
    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/require-default-props.md
    'react/require-default-props': [
      'error',
      { forbidDefaultForRequired: true },
    ],

    // https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/self-closing-comp.md
    'react/self-closing-comp': [
      'error',
      {
        component: true,
        html: false,
      },
    ],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/style-prop-object.md
    'react/style-prop-object': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/void-dom-elements-no-children.md
    'react/void-dom-elements-no-children': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-target-blank.md
    'react/jsx-no-target-blank': 'off',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-undef.md
    'react/jsx-no-undef': ['error', { allowGlobals: true }],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-pascal-case.md
    'react/jsx-pascal-case': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/no-unused-state.md
    'react/no-unused-state': 'error',
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/state-in-constructor.md
    'react/state-in-constructor': ['error', 'never'],
    // https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/static-property-placement.md
    'react/static-property-placement': 'error',
    // https://reactjs.org/docs/hooks-rules.html
    'react-hooks/rules-of-hooks': 'error',
    // https://github.com/facebook/react/issues/16006
    'react-hooks/exhaustive-deps': 'off',
  },
};
