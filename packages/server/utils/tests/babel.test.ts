import path from 'path';
import { defaults } from './helpers';
import { resolveBabelConfig } from '../src/index';

describe('babel', () => {
  it('resolveBabelConfig', () => {
    const pwd = path.resolve(__dirname, './fixtures');
    const tsconfigPath = path.resolve(
      __dirname,
      './fixtures/api/tsconfig.json',
    );
    const config = resolveBabelConfig(pwd, defaults as any, {
      type: 'commonjs',
      syntax: 'es6+',
      tsconfigPath,
    });

    const root = path.resolve(__dirname, '../../../../');

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
            ? `"${val.replace(/.+node_modules/, '').replace(/\\/g, '/')}"`
            : val.includes('modern.js')
            ? `"${val.replace(/.+modern\.js/, '').replace(/\\/g, '/')}"`
            : `"${val.replace(root, '').replace(/\\/g, '/')}"`
          : (val as string),
    });

    expect(config).toMatchSnapshot();
  });
});
