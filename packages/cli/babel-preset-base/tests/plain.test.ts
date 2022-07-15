import { createBabelPlainChain } from '../src/babel-chain';

describe('plain', () => {
  describe('setter', () => {
    it('cwd', () => {
      const chain = createBabelPlainChain();

      chain.plain.cwd('test');

      expect(chain.toJSON().cwd).toBe('test');
    });

    it('caller', () => {
      const chain = createBabelPlainChain();
      const caller = { name: 'test' };

      chain.plain.caller(caller);

      expect(chain.toJSON().caller).toStrictEqual(caller);
    });

    it('filename', () => {
      const chain = createBabelPlainChain();

      chain.plain.filename('test');

      expect(chain.toJSON().filename).toBe('test');
    });

    it('filenameRelative', () => {
      const chain = createBabelPlainChain();

      chain.plain.filenameRelative('test');

      expect(chain.toJSON().filenameRelative).toBe('test');
    });

    it('code', () => {
      const chain = createBabelPlainChain();

      chain.plain.code(true);

      expect(chain.toJSON().code).toBe(true);
    });

    it('ast', () => {
      const chain = createBabelPlainChain();

      chain.plain.ast(true);

      expect(chain.toJSON().ast).toBe(true);
    });

    it('delete', () => {
      const chain = createBabelPlainChain();

      chain.plain.ast(true);

      expect(chain.toJSON().ast).toBe(true);

      chain.plain.delete('ast');

      expect(chain.toJSON().ast).toBe(undefined);
    });
  });

  describe('toJSON', () => {
    it('base usage', () => {
      const chain = createBabelPlainChain();

      chain.plain.cwd('test');

      const caller = { name: 'test' };
      chain.plain.caller(caller);

      chain.plain.filename('test');

      chain.plain.filenameRelative('test');

      expect(chain.toJSON()).toStrictEqual({
        cwd: 'test',
        caller,
        filename: 'test',
        filenameRelative: 'test',
      });
    });
  });

  describe('merge', () => {
    it('base usage', () => {
      const chain = createBabelPlainChain();
      chain.plain.cwd('test');

      const other = createBabelPlainChain();
      other.plain.filename('test');

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual({
        cwd: 'test',
        filename: 'test',
      });
    });

    it('straightforward', () => {
      const chain = createBabelPlainChain();
      chain.plain.cwd('foo');

      const other = createBabelPlainChain();
      other.plain.cwd('bar');

      chain.merge(other);

      expect(chain.toJSON()).toStrictEqual({ cwd: 'bar' });
    });
  });
});
