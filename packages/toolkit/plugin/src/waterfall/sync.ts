import {
  Container,
  useContainer,
  createPipeline,
  Middleware,
} from 'farrow-pipeline';

const WATERFALL_SYMBOL = Symbol('WATERFALL_SYMBOL');

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
  // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
  throw new Error(`${input} is not a Brook or { brook: Brook }`);
};

export type RunWaterfallOptions<I = unknown> = {
  container?: Container;
  onLast?: Brook<I>;
};

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Waterfall<I = void> = {
  run: (input: I, options?: RunWaterfallOptions<I>) => I;
  use: (...I: BrookInputs<I>) => Waterfall<I>;
  middleware: Brook<I>;
  [WATERFALL_SYMBOL]: true;
};

export type Waterfall2Brook<P extends Waterfall<any>> = P extends Waterfall<
  infer I
>
  ? Brook<I>
  : never;

export type WaterfallRecord = Record<string, Waterfall<any>>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Waterfalls2Brooks<PS extends WaterfallRecord | void> = {
  [K in keyof PS]: PS[K] extends Waterfall<any>
    ? Waterfall2Brook<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export type RunnerFromWaterfall<M extends Waterfall<any>> = M extends Waterfall<
  infer VS
>
  ? Waterfall<VS>['run']
  : never;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Waterfalls2Runners<PS extends WaterfallRecord | void> = {
  [K in keyof PS]: PS[K] extends Waterfall<any>
    ? RunnerFromWaterfall<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export const createWaterfall = <I = void>(): Waterfall<I> => {
  const pipeline = createPipeline<I, I>();

  const use: Waterfall<I>['use'] = (...brooks) => {
    pipeline.use(...brooks.map(getBrook).map(mapBrookToMiddleware));
    return waterfall;
  };

  const run: Waterfall<I>['run'] = (input, options) =>
    // eslint-disable-next-line @typescript-eslint/no-shadow
    pipeline.run(input, { ...options, onLast: input => input });

  const middleware: Waterfall<I>['middleware'] = input => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return pipeline.run(input, { container, onLast: input => input });
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
