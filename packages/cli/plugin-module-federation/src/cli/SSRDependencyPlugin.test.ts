import { describe, expect, it } from '@rstest/core';
import { SSRDependencyPlugin } from './SSRDependencyPlugin';

describe('SSRDependencyPlugin', () => {
  it('rejects cache updates before compiling with an unsupported Rspack', () => {
    const compiler = {
      webpack: { RuntimeGlobals: {} },
    } as Parameters<SSRDependencyPlugin['apply']>[0];
    expect(() =>
      new SSRDependencyPlugin({ name: 'host', remotes: ['remote'] }).apply(
        compiler,
      ),
    ).toThrow('require a Rspack build with SSR cache update support');
  });
});
