import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    sourceMap: false,
    filenameHash: false,
    // The es5 expectation must be stated: the framework's default
    // browserslist targets modern engines, and without this the build emits
    // es6+ and checkSyntax below fails (this was hidden while build failures
    // were silently swallowed by the test utils).
    overrideBrowserslist: ['ie >= 11'],
  },
  security: {
    checkSyntax: {
      ecmaVersion: 5,
      // The router runtime keeps a genuine dynamic import() for lazy route
      // modules; that syntax has no es5 form, so the check covers everything
      // except that one chunk.
      exclude: [/lib-router\.js$/],
    },
  },
});
