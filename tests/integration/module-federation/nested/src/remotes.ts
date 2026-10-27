import { registerRemotes } from '@module-federation/enhanced/runtime';
registerRemotes([
  {
    name: 'lab_library',
    alias: 'dynamic',
    entry: `${process.env.MF_LAB_LIBRARY}/mf-manifest.json`,
  },
]);
