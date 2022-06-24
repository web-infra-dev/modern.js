import {
  createWaterfall,
  createAsyncWaterfall,
  createContext,
  isWaterfall,
  isAsyncWaterfall,
} from '../src';
import { sleep } from './helpers';

describe('waterfall', () => {
  it('base usage', () => {
    const waterfall = createWaterfall<{ count: number }>();

    waterfall.use(({ count }) => ({ count: count + 1 }));

    waterfall.use(a => a);

    waterfall.use(a => a);

    expect(waterfall.run({ count: 0 })).toStrictEqual({ count: 1 });
  });

  it('should support async waterfall', async () => {
    const waterfall = createAsyncWaterfall<{ count: number }>();

    waterfall.use(async ({ count }) => ({ count: count + 1 }));

    waterfall.use(a => a);

    waterfall.use(a => a);

    expect(await waterfall.run({ count: 0 })).toStrictEqual({ count: 1 });
  });

  it('should support hook in async waterfall', async () => {
    const waterfall = createAsyncWaterfall<number>();

    const Count = createContext({ count: 10 });

    const incre = async () => {
      await sleep(0);
      Count.set({ count: Count.get().count + 1 });
    };
    const list: { count: number }[] = [];

    waterfall.use(async count => {
      const before = Count.get();

      await incre();

      const after = Count.get();

      list.push(before, after);

      return count + Count.get().count;
    });

    waterfall.use(async count => {
      await sleep(0);
      await incre();

      return count + Count.get().count;
    });

    const result = await waterfall.run(10);

    expect(result).toBe(33);
    expect(list).toStrictEqual([{ count: 10 }, { count: 11 }]);
  });

  describe('sync', () => {
    it('should support waterfall.use(anotherWaterfall) if their type is matched', () => {
      const StepContext = createContext(1);

      const waterfall0 = createWaterfall<number>();

      const waterfall1 = createWaterfall<number>();

      const steps = [] as number[];

      waterfall0.use(input => {
        const step = StepContext.use();
        return input + step.value++;
      });

      waterfall0.use(waterfall1);

      waterfall1.use(input => {
        const step = StepContext.use();
        steps.push(step.value);
        return input + step.value;
      });

      const result0 = waterfall1.run(0);
      const result1 = waterfall0.run(0);

      expect(result0).toEqual(1);
      expect(result1).toEqual(3);
      expect(steps).toEqual([1, 2]);
    });

    it('should throw error when add illegal brook', () => {
      const waterfall = createWaterfall<number>();
      expect(() => waterfall.use({} as any)).toThrowError();
    });

    it('isWaterfall', () => {
      const waterfall = createWaterfall();

      expect(isWaterfall(waterfall)).toBeTruthy();
      expect(isWaterfall({})).toBeFalsy();
      expect(isWaterfall('test')).toBeFalsy();
      expect(isWaterfall(null)).toBeFalsy();
    });
  });

  describe('async', () => {
    it('should support waterfall.use(anotherWaterfall) if their type is matched', async () => {
      const StepContext = createContext(1);

      const waterfall0 = createAsyncWaterfall<number>();

      const waterfall1 = createAsyncWaterfall<number>();

      const steps = [] as number[];

      waterfall0.use(async input => {
        await sleep(0);
        const step = StepContext.use();
        return input + step.value++;
      });

      waterfall0.use(waterfall1);

      waterfall1.use(async input => {
        const step = StepContext.use();
        steps.push(step.value);
        await sleep(0);
        return input + step.value;
      });

      const result0 = await waterfall1.run(0);
      const result1 = await waterfall0.run(0);

      expect(result0).toEqual(1);
      expect(result1).toEqual(3);
      expect(steps).toEqual([1, 2]);
    });

    it('should throw error when add illegal brook', () => {
      const waterfall = createAsyncWaterfall<number>();
      expect(() => waterfall.use({} as any)).toThrowError();
    });

    it('isAsyncWaterfall', () => {
      const waterfall = createAsyncWaterfall();

      expect(isAsyncWaterfall(waterfall)).toBeTruthy();
      expect(isAsyncWaterfall({})).toBeFalsy();
      expect(isAsyncWaterfall('test')).toBeFalsy();
      expect(isAsyncWaterfall(null)).toBeFalsy();
    });
  });
});
