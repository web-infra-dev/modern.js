import {
  createAsyncPipeline,
  Middleware,
  MaybeAsync,
  Container,
  useContainer,
} from 'farrow-pipeline';

const ASYNC_WATERFALL_SYMBOL = Symbol('ASYNC_WATERFALL_SYMBOL');

export type AsyncBrook<I = unknown> = (I: I) => MaybeAsync<I>;
export type AsyncBrookInput<I = unknown> =
  | AsyncBrook<I>
  | { middlware: AsyncBrook<I> };
export type AsyncBrooks<I = unknown> = AsyncBrook<I>[];
export type AsyncBrookInputs<I = unknown> = AsyncBrookInput<I>[];

export const getAsyncBrook = <I>(input: AsyncBrookInput<I>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.middlware === 'function') {
    return input.middlware;
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
  throw new Error(`${input} is not a AsyncBrook or { brook: AsyncBrook }`);
};

export type RunAsyncWaterfallOptions<I = unknown> = {
  container?: Container;
  onLast?: AsyncBrook<I>;
};

export type AsyncWaterfall<I> = {
  run: (input: I, options?: RunAsyncWaterfallOptions<I>) => MaybeAsync<I>;
  use: (...I: AsyncBrookInputs<I>) => AsyncWaterfall<I>;
  middlware: AsyncBrook<I>;
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
  const pipeline = createAsyncPipeline<I, I>();

  const use: AsyncWaterfall<I>['use'] = (...input) => {
    pipeline.use(
      ...input.map(getAsyncBrook).map(mapAsyncBrookToAsyncMiddleware),
    );
    return waterfall;
  };

  const run: AsyncWaterfall<I>['run'] = (input, options) =>
    // eslint-disable-next-line @typescript-eslint/no-shadow
    pipeline.run(input, { ...options, onLast: input => input });

  const middlware: AsyncWaterfall<I>['middlware'] = input => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return pipeline.run(input, { container, onLast: input => input });
  };

  const waterfall: AsyncWaterfall<I> = {
    ...pipeline,
    use,
    run,
    middlware,
    [ASYNC_WATERFALL_SYMBOL]: true as const,
  };

  return waterfall;
};

export const isAsyncWaterfall = (input: any): input is AsyncWaterfall<any> =>
  Boolean(input?.[ASYNC_WATERFALL_SYMBOL]);

const mapAsyncBrookToAsyncMiddleware =
  <I>(brook: AsyncBrook<I>): Middleware<I, MaybeAsync<I>> =>
  async (input, next) =>
    next(await brook(input));
