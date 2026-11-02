import { analyzeRootExport } from '../../src/cli/federation/analyze';

it.each(['createBridgeComponent', 'createModernBridgeComponent'])(
  'keeps one selected application definition for %s',
  helper => {
    const result = analyzeRootExport(
      `
import '@modern-js/runtime/registry/admin';
import { createRoot as makeRoot } from '@modern-js/runtime/react';
import { ${helper} as bridge } from '@modern-js/runtime/mf';
const Root = makeRoot({ route: '/product' });
export default bridge({ rootComponent: Root });
`,
      '/application.tsx',
      'modern-js',
    );
    expect(result).toMatchObject({
      entry: 'admin',
      route: '/product',
      rootImport: 'makeRoot',
    });
  },
);

it('does not apply Modern definition transforms to an unrelated same-name function', () => {
  expect(
    analyzeRootExport(
      `
import '@modern-js/runtime/registry';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from './business';
const Root = createRoot({ route: '/product' });
export default createModernBridgeComponent({ rootComponent: Root });
`,
      '/application.tsx',
      'modern-js',
    ),
  ).toBeUndefined();
});
