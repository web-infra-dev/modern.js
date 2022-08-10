/**
 * Auto import `core-js` when `output.polyfill === 'entry'`
 * We should not add `core-js` as an webpack entry,
 * otherwise the @babel/preset-env can not transform core-js to sub-paths.
 */
import 'core-js';
