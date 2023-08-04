import assert from 'assert';
import { getAllDeps } from '../../src/utils';

describe('getAllDeps', () => {
  it('default', () => {
    const { dep } = getAllDeps(process.cwd(), true);
    assert(dep.indexOf('esbuild') > -1);
  });
  it('bundle dep', () => {
    const { dep } = getAllDeps(process.cwd(), { dependencies: false });
    assert(dep.indexOf('esbuild') === -1);
  });
});
