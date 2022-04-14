import path from 'path';
import { fs } from '@modern-js/utils';

const resolver = require('../src/config/resolver');

describe('plugin-testing', () => {
  it('resolver', () => {
    const moduleDir = path.join(
      __dirname,
      'node_modules/@modern-js/runtime/module',
    );
    fs.ensureDirSync(moduleDir);
    fs.writeJSONSync(
      path.join(moduleDir, 'package.json'),
      {
        name: '@modern-js/runtime/module',
        main: './index.js',
      },
      'utf-8',
    );
    fs.writeFileSync(
      path.join(moduleDir, 'index.js'),
      'module.exports = "@modern-js/runtime/module"',
      'utf-8',
    );
    expect(
      resolver('@modern-js/runtime/module', { basedir: __dirname }),
    ).toContain('module');
  });
});
