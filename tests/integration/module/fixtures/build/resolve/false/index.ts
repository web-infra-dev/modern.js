// In some directory structure, we can not resolve './util.inspect' from 'index.js' in 'object-inspect',
// For example, in bytedance internal monorepo solution, but here we can resolve it.

import xxx from 'object-inspect';

console.log('xxx:', xxx);
