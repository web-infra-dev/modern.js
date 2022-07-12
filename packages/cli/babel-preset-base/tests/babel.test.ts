import { createBabelChain } from '../src/babel-chain';

describe('babel', () => {
  describe('setter', () => {
    it('preset', () => {
      const chain = createBabelChain();

      chain.preset('foo').tap([]);

      expect(chain.toJSON()).toStrictEqual({ presets: [['foo']], plugins: [] });
    });

    it('plugin', () => {
      const chain = createBabelChain();

      chain.plugin('foo').tap([]);

      expect(chain.toJSON()).toStrictEqual({ presets: [], plugins: [['foo']] });
    });

    it('plain', () => {
      const chain = createBabelChain();

      chain.cwd('foo');

      expect(chain.toJSON()).toStrictEqual({
        cwd: 'foo',
        presets: [],
        plugins: [],
      });
    });
  });

  describe('toJSON', () => {
    it('base usage', () => {
      const chain = createBabelChain();

      chain.preset('foo').tap([]);
      chain.plugin('foo').tap([]);
      chain.cwd('foo');

      expect(chain.toJSON()).toStrictEqual({
        presets: [['foo']],
        plugins: [['foo']],
        cwd: 'foo',
      });
    });
  });

  describe('merge', () => {
    it('plain', () => {
      const chain = createBabelChain();
      chain.cwd('test');

      const other = createBabelChain();
      other.filename('test');

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual({
        cwd: 'test',
        filename: 'test',
        presets: [],
        plugins: [],
      });
    });

    it('preset', () => {
      const chain = createBabelChain();
      chain.preset('foo').tap([{ fooOpt: 'test' }]);

      const other = createBabelChain();
      other.preset('bar').tap([{ barOpt: 'test' }]);

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual({
        presets: [
          ['foo', { fooOpt: 'test' }],
          ['bar', { barOpt: 'test' }],
        ],
        plugins: [],
      });
    });

    it('plugin', () => {
      const chain = createBabelChain();
      chain.plugin('foo').tap([{ fooOpt: 'test' }]);

      const other = createBabelChain();
      other.plugin('bar').tap([{ barOpt: 'test' }]);

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual({
        presets: [],
        plugins: [
          ['foo', { fooOpt: 'test' }],
          ['bar', { barOpt: 'test' }],
        ],
      });
    });
  });
});
