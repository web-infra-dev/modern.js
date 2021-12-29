export default ({
  cssVarsHash = {},
}: { cssVarsHash?: Record<string, string> } = {}) => ({
  postcssPlugin: 'postcss-replace-css-vars',
  Declaration(decl: any) {
    // console.info(decl);
    if (decl.value && typeof decl.value === 'string') {
      decl.value = (decl.value as string).replace(/--\S*/g, match => {
        if (cssVarsHash[match]) {
          return cssVarsHash[match];
        }

        return match;
      });
    }
  },
});
