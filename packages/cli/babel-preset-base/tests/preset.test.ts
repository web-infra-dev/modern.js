import { createBabelPresetChain } from '../src/babel-chain';

describe('preset', () => {
  describe('setter', () => {
    it('tap', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').tap([{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([['foo', { fooOpt: 'test' }]]);
    });

    it('delete', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').tap([{ fooOpt: 'test' }]);
      chain.preset('foo').delete();

      expect(chain.toJSON()).toStrictEqual([]);
    });

    it('ban', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').ban();

      expect(() =>
        chain.preset('foo').tap([{ fooOpt: 'test' }]),
      ).toThrowError();
    });

    it('use', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').use('path/to/foo');

      expect(chain.toJSON()).toStrictEqual([['path/to/foo']]);
    });
  });

  describe('toJSON', () => {
    it('base usage', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').tap([{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([['foo', { fooOpt: 'test' }]]);
    });

    it('with path', () => {
      const chain = createBabelPresetChain();

      chain.preset('foo').use('path/to/foo', [{ fooOpt: 'test' }]);

      expect(chain.toJSON()).toStrictEqual([
        ['path/to/foo', { fooOpt: 'test' }],
      ]);
    });
  });

  describe('merge', () => {
    it('base usage', () => {
      const chain = createBabelPresetChain();
      chain.preset('foo').tap([{ fooOpt: 'test' }]);

      const other = createBabelPresetChain();
      other.preset('bar').tap([{ barOpt: 'test' }]);

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual([
        ['foo', { fooOpt: 'test' }],
        ['bar', { barOpt: 'test' }],
      ]);
    });
  });
});
