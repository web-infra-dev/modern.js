import { createCounter, createAsyncCounter } from '@/counter';

describe('counter', () => {
  describe('sync', () => {
    it('base usage', () => {
      const counter = createCounter<number, number>((index, input, next) => {
        if (index >= 10) {
          return input;
        }
        return next(input * 2);
      });

      expect(counter.start(1)).toBe(2 ** 10);
    });
  });

  describe('async', () => {
    it('base usage', async () => {
      const counter = createAsyncCounter<number, number>(
        // eslint-disable-next-line @typescript-eslint/require-await
        async (index, input, next) => {
          if (index >= 10) {
            return input;
          }
          return next(input * 2);
        },
      );

      expect(await counter.start(1)).toBe(2 ** 10);
    });
  });
});
