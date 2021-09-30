import path from 'path';
import { defaults } from './helpers';
import { resolveBabelConfig } from '@/index';

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

    expect.addSnapshotSerializer({
      test: val => typeof val === 'string' && val.includes('modern-js'),
      print: val =>
        // eslint-disable-next-line no-nested-ternary
        typeof val === 'string'
          ? val.includes('node_modules')
            ? `"${val.replace(/.+node_modules/, '')}"`
            : `"${val.replace(/.+modern-js/, '')}"`
          : (val as string),
    });

    expect(config).toMatchSnapshot();
  });
});
