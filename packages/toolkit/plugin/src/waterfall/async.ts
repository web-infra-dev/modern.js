import { createAsyncCounter } from '../counter';
import {
  Hooks,
  runHooks,
  fromContainer,
  createContainer,
  useContainer,
} from '../context';
import type { RunWaterfallOptions } from './sync';

const ASYNC_WATERFALL_SYMBOL = Symbol('ASYNC_WATERFALL_SYMBOL');

export type AsyncBrook<I = unknown> = (
  I: I,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => I | Promise<I> | void | Promise<void>;
export type AsyncBrookInput<I = unknown> =
  | AsyncBrook<I>
  | { brook: AsyncBrook<I> };
export type AsyncBrooks<I = unknown> = AsyncBrook<I>[];
export type AsyncBrookInputs<I = unknown> = AsyncBrookInput<I>[];

export const getAsyncBrook = <I>(input: AsyncBrookInput<I>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.brook === 'function') {
    return input.brook;
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
  throw new Error(`${input} is not a AsyncBrook or { brook: AsyncBrook }`);
};

export type AsyncWaterfall<I> = {
  run: (input: I, options?: RunWaterfallOptions<I>) => Promise<I>;
  use: (...I: AsyncBrookInputs<I>) => AsyncWaterfall<I>;
  brook: AsyncBrook<I>;
  [ASYNC_WATERFALL_SYMBOL]: true;
};

export type AsyncWaterfall2AsyncBrook<P extends AsyncWaterfall<any>> =
  P extends AsyncWaterfall<infer I> ? AsyncBrook<I> : never;

export type AsyncWaterfallRecord = Record<string, AsyncWaterfall<any>>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncWaterfalls2Brooks<PS extends AsyncWaterfallRecord | void> = {
  [K in keyof PS]: PS[K] extends AsyncWaterfall<any>
    ? AsyncWaterfall2AsyncBrook<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export type RunnerFromAsyncWaterfall<M extends AsyncWaterfall<any>> =
  M extends AsyncWaterfall<infer VS> ? AsyncWaterfall<VS>['run'] : never;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncWaterfalls2Runners<PS extends AsyncWaterfallRecord | void> = {
  [K in keyof PS]: PS[K] extends AsyncWaterfall<any>
    ? RunnerFromAsyncWaterfall<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export const createAsyncWaterfall = <I = void>(): AsyncWaterfall<I> => {
  const middlewares: AsyncBrooks<I> = [];

  const createCurrentRunner = (hooks: Hooks) =>
    createAsyncCounter<I, I>(async (index, input, next) => {
      if (index >= middlewares.length) {
        return input;
      }

      return runHooks(
        async () => next((await middlewares[index](input)) || input),
        hooks,
      );
    });

  const currentContainer = createContainer();
  const currentHooks = fromContainer(currentContainer);
  const currentRunner = createCurrentRunner(currentHooks);

  const use: AsyncWaterfall<I>['use'] = (...input) => {
    middlewares.push(...input.map(getAsyncBrook));
    return waterfall;
  };

  const run: AsyncWaterfall<I>['run'] = async (input, options) => {
    const container = options?.container ?? currentContainer;
    const hooks =
      container === currentContainer ? currentHooks : fromContainer(container);
    const runner =
      container === currentContainer
        ? currentRunner
        : createCurrentRunner(hooks);

    return runner.start(input);
  };

  const brook: AsyncWaterfall<I>['brook'] = input => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    return run(input, { container });
  };

  const waterfall = {
    use,
    run,
    brook,
    [ASYNC_WATERFALL_SYMBOL]: true as const,
  };

  return waterfall;
};

export const isAsyncWaterfall = (input: any): input is AsyncWaterfall<any> =>
  Boolean(input?.[ASYNC_WATERFALL_SYMBOL]);
