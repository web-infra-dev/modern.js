import path from 'path';
import { manager } from '@modern-js/core';
import plugin, { isNodeModulesLess } from '../src/cli';

const root = path.normalize(path.resolve(__dirname, '../../../../'));
expect.addSnapshotSerializer({
  test: val =>
    typeof val === 'string' &&
    (val.includes('modern.js') ||
      val.includes('node_modules') ||
      val.includes(root)),
  print: val =>
    // eslint-disable-next-line no-nested-ternary
    typeof val === 'string'
      ? // eslint-disable-next-line no-nested-ternary
        val.includes('node_modules')
        ? `"${val.replace(/.+node_modules/, '')}"`
        : val.includes('modern.js')
        ? `"${val.replace(/.+modern\.js/, '')}"`
        : `"${val.replace(root, '')}"`
      : (val as string),
});

describe('plugin less test', () => {
  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.validateSchema();

    expect(result).toMatchSnapshot();
  });

  it('config', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.config();
    expect(result).toMatchSnapshot();
  });
});

describe('css rule utils', () => {
  it('should test `.less` file in node_modules correctly', () => {
    expect(isNodeModulesLess('node_modules/foo/bar.less')).toEqual(true);
    expect(isNodeModulesLess('node_modules/foo/bar.module.less')).toEqual(
      false,
    );
    expect(isNodeModulesLess('node_module/foo/bar.less')).toEqual(false);
    expect(isNodeModulesLess('src/foo/bar.less')).toEqual(false);
    expect(isNodeModulesLess('src/foo/bar.module.less')).toEqual(false);
    expect(isNodeModulesLess('node_modules/foo/bar.js')).toEqual(false);
    expect(isNodeModulesLess('node_modules/foo/bar.css')).toEqual(false);
    expect(isNodeModulesLess('node_modules/foo/bar.scss')).toEqual(false);
  });
});
