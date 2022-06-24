// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
import {
  createContext,
  createPipeline,
  createAsyncPipeline,
  isPipeline,
} from '../src';
import { sleep } from './helpers';

describe('createPipeline', () => {
  it('basic usage', async () => {
    type Input = {
      count: number;
    };
    type Output = PromiseLike<number> | number;

    const pipeline = createPipeline<Input, Output>();

    let list: number[] = [];

    pipeline.use((input, next) => {
      list.push(1);
      return next(input);
    });

    pipeline.use((input, next) => {
      list.push(2);
      return next(input);
    });

    pipeline.use((input, next) => {
      list.push(3);
      return next(input);
    });

    pipeline.use((input, next) => {
      if (input.count < 10) {
        return input.count + 1;
      }

      return next(input);
    });

    pipeline.use(input => {
      list.push(4);
      return input.count + 2;
    });

    const result0 = await pipeline.run({ count: 0 });

    expect(result0).toEqual(1);
    expect(list).toEqual([1, 2, 3]);

    list = [];

    const result1 = await pipeline.run({ count: 10 });

    expect(result1).toEqual(12);
    expect(list).toEqual([1, 2, 3, 4]);
  });

  it('can change input and output', async () => {
    const pipeline = createPipeline<number, Promise<number>>();

    let list: number[] = [];

    pipeline.use(async (input, next) => {
      list.push(input);
      const result = await next(input + 1);
      list.push(result);
      return result + 1;
    });

    pipeline.use(input => {
      list.push(input);
      return Promise.resolve(input + 1);
    });

    const result0 = await pipeline.run(0);

    expect(result0).toEqual(3);
    expect(list).toEqual([0, 1, 2]);

    list = [];

    const result1 = await pipeline.run(11);

    expect(result1).toEqual(14);
    expect(list).toEqual([11, 12, 13]);
  });

  it('supports hooks in async middleware', async () => {
    const Context0 = createContext(0);

    const pipeline = createAsyncPipeline<number, number>();

    const list: number[] = [];

    pipeline.use(async (input, next) => {
      const Context = Context0.use();

      list.push(Context.value);

      Context.value += 1;

      const result = await next(input);

      list.push(Context.value);

      return result;
    });

    pipeline.use(async (input, next) => {
      const Context = Context0.use();

      list.push(Context.value);

      Context.value += 2;

      const result = await next(input);

      list.push(Context.value);

      Context.value += 3;

      return result;
    });

    pipeline.use(input => {
      const Context = Context0.use();
      list.push(Context.value);
      Context.value += 1;
      return Promise.resolve(input + Context.value);
    });

    const result = await pipeline.run(10);

    expect(result).toEqual(14);
    expect(list).toEqual([0, 1, 3, 4, 7]);
  });

  it('should throw error if there are no middlewares in pipeline', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>();

    let error: unknown = null;

    try {
      await pipeline.run(1);
    } catch (e) {
      error = e;
    }

    expect(error === null).toBe(false);
  });

  it('should throw error if there are no middlewares returning value', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>();

    pipeline.use((input, next) => next(input));

    pipeline.use((input, next) => next(input));

    pipeline.use((input, next) => next(input));

    pipeline.use((input, next) => next(input));

    let error: unknown = null;

    try {
      await pipeline.run(1);
    } catch (e) {
      error = e;
    }

    expect(error === null).toBe(false);
  });

  it('should invoke onLast if there are no middlewares returned value', async () => {
    const pipeline = createPipeline<number, PromiseLike<number> | number>();

    const list: number[] = [];

    pipeline.use((input, next) => {
      list.push(1);
      return next(input);
    });

    pipeline.use((input, next) => {
      list.push(2);
      return next(input);
    });

    pipeline.use((input, next) => {
      list.push(3);
      return next(input);
    });

    pipeline.use((input, next) => {
      list.push(4);
      return next(input);
    });

    const result = await pipeline.run(1, { onLast: input => input + 4 });

    expect(result).toEqual(5);
    expect(list).toEqual([1, 2, 3, 4]);
  });

  it('should support multiple middlewares in pipeline.use', () => {
    const pipeline = createPipeline<number, number>();

    pipeline.use(
      (input, next) => next(input + 1),
      (input, next) => next(input + 1),
      (input, next) => next(input + 1),
      (input, next) => next(input + 1),
      input => input + 1,
    );

    const result = pipeline.run(0);

    expect(result).toBe(5);
  });

  it('should support the shape of { middleware } as arguments in pipeline.use', () => {
    const pipeline = createPipeline<number, number>();

    pipeline.use(
      { middleware: (input, next) => next(input + 1) },
      { middleware: (input, next) => next(input + 1) },
      { middleware: (input, next) => next(input + 1) },
      { middleware: (input, next) => next(input + 1) },
      input => input + 1,
    );

    const result = pipeline.run(0);

    expect(result).toBe(5);
  });

  it('should support pipeline.use(anotherPipeline) if their type is matched', () => {
    const StepContext = createContext(1);

    const pipeline0 = createPipeline<number, number>();

    const pipeline1 = createPipeline<number, number>();

    const steps = [] as number[];

    pipeline0.use((input, next) => {
      const step = StepContext.use();
      return next(input + step.value++);
    });

    pipeline0.use(pipeline1);

    pipeline1.use(input => {
      const step = StepContext.use();
      steps.push(step.value);
      return input + step.value;
    });

    const result0 = pipeline1.run(0);
    const result1 = pipeline0.run(0);

    expect(result0).toEqual(1);
    expect(result1).toEqual(3);
    expect(steps).toEqual([1, 2]);
  });

  describe('sync', () => {
    it('should support pipeline.use(anotherPipeline) if their type is matched', () => {
      const StepContext = createContext(1);

      const pipeline0 = createPipeline<number, number>();

      const pipeline1 = createPipeline<number, number>();

      const steps = [] as number[];

      pipeline0.use((input, next) => {
        const step = StepContext.use();
        return next(input + step.value++);
      });

      pipeline0.use(pipeline1);

      pipeline1.use(input => {
        const step = StepContext.use();
        steps.push(step.value);
        return input + step.value;
      });

      const result0 = pipeline1.run(0);
      const result1 = pipeline0.run(0);

      expect(result0).toEqual(1);
      expect(result1).toEqual(3);
      expect(steps).toEqual([1, 2]);
    });

    it('should throw error when add illegal middleware', () => {
      const pipeline = createPipeline<number, number>();
      expect(() => pipeline.use({} as any)).toThrowError();
    });

    it('isPipeline', () => {
      const pipeline = createPipeline();

      expect(isPipeline(pipeline)).toBeTruthy();
      expect(isPipeline({})).toBeFalsy();
      expect(isPipeline('test')).toBeFalsy();
      expect(isPipeline(null)).toBeFalsy();
    });

    it('support hooks', async () => {
      const Context0 = createContext(0);

      const pipeline = createPipeline<number, PromiseLike<number> | number>();

      const list: number[] = [];

      pipeline.use((input, next) => {
        const Context = Context0.use();

        list.push(Context.value);

        Context.value += 1;

        return next(input);
      });

      pipeline.use((input, next) => {
        const Context = Context0.use();

        list.push(Context.value);

        Context.value += 2;

        return next(input);
      });

      pipeline.use(input => {
        const Context = Context0.use();
        list.push(Context.value);
        return input + Context.value;
      });

      const result = await pipeline.run(10);

      expect(result).toEqual(13);
      expect(list).toEqual([0, 1, 3]);
    });

    it('should throw error when all middlewares calling next() and onLast is not exist', () => {
      const pipeline = createPipeline<number, number>();

      pipeline.use((input, next) => next(input));

      expect(() => pipeline.run(0)).toThrowError();
    });

    it('should calling onLast when all middlewares calling next() and onLast is exist', () => {
      const pipeline = createPipeline<number, number>();

      pipeline.use((input, next) => next(input));

      expect(pipeline.run(0, { onLast: () => 10 })).toBe(10);
    });
  });

  describe('async', () => {
    it('support async pipeline', async () => {
      const pipeline = createAsyncPipeline<number, number>();

      pipeline.use((input, next) => next(input + 1));

      let i = 0;

      pipeline.use((input, next) => {
        const count = ++i;
        return next(input + count);
      });

      pipeline.use(async (input, next) => {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const count = await ++i;
        return next(input + count);
      });

      pipeline.use(input => input);

      expect(i).toBe(0);

      const result0 = await pipeline.run(0);

      expect(result0).toBe(4);
      expect(i).toBe(2);

      const result1 = await pipeline.run(-4);

      expect(result1).toBe(4);
      expect(i).toBe(4);
    });

    it('should support pipeline.use(anotherPipeline) if their type is matched', async () => {
      const StepContext = createContext(1);

      const pipeline0 = createAsyncPipeline<number, number>();

      const pipeline1 = createAsyncPipeline<number, number>();

      const steps = [] as number[];

      pipeline0.use(async (input, next) => {
        await sleep(0);
        const step = StepContext.use();
        return next(input + step.value++);
      });

      pipeline0.use(pipeline1);

      pipeline1.use(async input => {
        const step = StepContext.use();
        steps.push(step.value);
        await sleep(0);
        return input + step.value;
      });

      const result0 = await pipeline1.run(0);
      const result1 = await pipeline0.run(0);

      expect(result0).toEqual(1);
      expect(result1).toEqual(3);
      expect(steps).toEqual([1, 2]);
    });

    it('should throw error when add illegal middleware', () => {
      const pipeline = createAsyncPipeline<number, number>();
      expect(() => pipeline.use({} as any)).toThrowError();
    });

    it('support hooks', async () => {
      const pipeline = createAsyncPipeline<number, number>();

      const Count = createContext({ count: 10 });

      const incre = async () => {
        await sleep(0);
        Count.set({ count: Count.get().count + 1 });
      };

      const list = [] as { count: number }[];

      pipeline.use(async (input, next) => {
        const before = Count.get();
        const result = await next(input);

        await incre();

        const after = Count.get();

        list.push(before, after);

        return result;
      });

      pipeline.use(async input => {
        await sleep(0);
        await incre();

        return input + Count.get().count;
      });

      const result0 = await pipeline.run(10);

      expect(result0).toEqual(21);
      expect(list).toEqual([{ count: 10 }, { count: 12 }]);
    });

    it('should throw error when all middlewares calling next() and onLast is not exist', async () => {
      const pipeline = createAsyncPipeline<number, number>();

      pipeline.use((input, next) => Promise.resolve().then(() => next(input)));

      await expect(() => pipeline.run(0)).rejects.toThrowError();
    });

    it('should calling onLast when all middlewares calling next() and onLast is exist', async () => {
      const pipeline = createAsyncPipeline<number, number>();

      pipeline.use((input, next) => next(input));

      const result = await pipeline.run(0, { onLast: () => 10 });

      expect(result).toBe(10);
    });
  });
});
