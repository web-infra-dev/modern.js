import type { Declaration } from 'postcss';

export default ({
  cssVarsHash = {},
}: { cssVarsHash?: Record<string, string> } = {}) => ({
  postcssPlugin: 'postcss-replace-css-vars',
  Declaration(decl: Declaration) {
    if (decl.value && typeof decl.value === 'string') {
      decl.value = decl.value.replace(/--\S*/g, match => {
        if (cssVarsHash[match]) {
          return cssVarsHash[match];
        }

        return match;
      });
    }
  },
});
