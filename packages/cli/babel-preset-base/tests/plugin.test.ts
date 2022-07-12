import { createBabelPluginChain } from '../src/babel-chain';

describe('plugin', () => {
  describe('setter', () => {
    it('tap', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').tap([{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([['foo', { fooOpt: 'test' }]]);
    });

    it('delete', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').tap([{ fooOpt: 'test' }]);
      chain.plugin('foo').delete();

      expect(chain.toJSON()).toStrictEqual([]);
    });

    it('ban', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').ban();

      expect(() =>
        chain.plugin('foo').tap([{ fooOpt: 'test' }]),
      ).toThrowError();
    });

    it('use', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').use('path/to/foo');

      expect(chain.toJSON()).toStrictEqual([['path/to/foo']]);
    });
  });

  describe('toJSON', () => {
    it('base usage', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').tap([{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([['foo', { fooOpt: 'test' }]]);
    });

    it('with path', () => {
      const chain = createBabelPluginChain();

      chain.plugin('foo').use('path/to/foo', [{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([
        ['path/to/foo', { fooOpt: 'test' }],
      ]);
    });
  });

  describe('merge', () => {
    it('base usage', () => {
      const chain = createBabelPluginChain();
      chain.plugin('foo').tap([{ fooOpt: 'test' }]);

      const other = createBabelPluginChain();
      other.plugin('bar').tap([{ barOpt: 'test' }]);

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual([
        ['foo', { fooOpt: 'test' }],
        ['bar', { barOpt: 'test' }],
      ]);
    });
  });
});
