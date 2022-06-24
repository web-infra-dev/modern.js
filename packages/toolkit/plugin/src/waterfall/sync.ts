import { createPipeline, Middleware } from '../farrow-pipeline';

const WATERFALL_SYMBOL = Symbol.for('MODERN_WATERFALL');

export type Brook<I = unknown> = (I: I) => I;
export type BrookInput<I = unknown> = Brook<I> | { middleware: Brook<I> };
export type Brooks<I = unknown> = Brook<I>[];
export type BrookInputs<I = unknown> = BrookInput<I>[];

export const getBrook = <I>(input: BrookInput<I>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.middleware === 'function') {
    return input.middleware;
  }
  throw new Error(`${input} is not a Brook or { brook: Brook }`);
};

export type RunWaterfallOptions<I = unknown> = {
  onLast?: Brook<I>;
};

export type Waterfall<I = void> = {
  run: (input: I, options?: RunWaterfallOptions<I>) => I;
  use: (...I: BrookInputs<I>) => Waterfall<I>;
  middleware: Brook<I>;
  [WATERFALL_SYMBOL]: true;
};

export const createWaterfall = <I = void>(): Waterfall<I> => {
  const pipeline = createPipeline<I, I>();

  const use: Waterfall<I>['use'] = (...brooks) => {
    pipeline.use(...brooks.map(getBrook).map(mapBrookToMiddleware));
    return waterfall;
  };

  const run: Waterfall<I>['run'] = (input, options) =>
    pipeline.run(input, { ...options, onLast: input => input });

  const middleware: Waterfall<I>['middleware'] = input => {
    return pipeline.run(input, { onLast: input => input });
  };

  const waterfall: Waterfall<I> = {
    ...pipeline,
    use,
    run,
    middleware,
    [WATERFALL_SYMBOL]: true,
  };
  return waterfall;
};

export const isWaterfall = (input: any): input is Waterfall<any> =>
  Boolean(input?.[WATERFALL_SYMBOL]);

const mapBrookToMiddleware =
  <I>(brook: Brook<I>): Middleware<I, I> =>
  (input, next) =>
    next(brook(input));
