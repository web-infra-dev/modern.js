import path from 'path';

export const staticPath = path.join(__dirname, '..', 'static');

export const demoComponentPath = path.join(
  __dirname,
  '..',
  'dist',
  'virtual-demo.js',
);

export const demoBlockComponentPath = path.join(
  staticPath,
  'global-components',
  'DemoBlock.tsx',
);
