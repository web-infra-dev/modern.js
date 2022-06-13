import { DEFAULT_LAZY_IMPORT_UI_COMPONENTS } from '../src/constants';
import { assembleCSSImportPath } from '../src/plugins/lazy-import';

describe('style tests', () => {
  test('support ui libraries', async () => {
    expect(DEFAULT_LAZY_IMPORT_UI_COMPONENTS).toContain('antd');
    expect(DEFAULT_LAZY_IMPORT_UI_COMPONENTS).toContain(
      '@arco-design/web-react',
    );
  });

  test('assemble ui import paths', async () => {
    expect(assembleCSSImportPath('antd', 'button')).toBe(
      `import 'antd/es/button/style/index.js'`,
    );
    expect(assembleCSSImportPath('@arco-design/web-react', 'Button')).toBe(
      `import '@arco-design/web-react/es/Button/style/index.js'`,
    );
  });
});
