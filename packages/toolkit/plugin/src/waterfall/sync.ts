import { createCounter } from '../counter';
import {
  Hooks,
  runHooks,
  fromContainer,
  Container,
  createContainer,
  useContainer,
} from '../context';

const WATERFALL_SYMBOL = Symbol('WATERFALL_SYMBOL');

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Brook<I = unknown> = (I: I) => I | void;
export type BrookInput<I = unknown> = Brook<I> | { brook: Brook<I> };
export type Brooks<I = unknown> = Brook<I>[];
export type BrookInputs<I = unknown> = BrookInput<I>[];

export const getBrook = <I>(input: BrookInput<I>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.brook === 'function') {
    return input.brook;
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
  brook: Brook<I>;
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
  const middlewares: Brooks<I> = [];

  const createCurrentRunner = (hooks: Hooks) =>
    createCounter<I, I>((index, input, next) => {
      if (index >= middlewares.length) {
        return input;
      }

      return runHooks(() => next(middlewares[index](input) || input), hooks);
    });

  const currentContainer = createContainer();
  const currentHooks = fromContainer(currentContainer);
  const currentRunner = createCurrentRunner(currentHooks);

  const use: Waterfall<I>['use'] = (...input) => {
    middlewares.push(...input.map(getBrook));
    return waterfall;
  };

  const run: Waterfall<I>['run'] = (input, options) => {
    const container = options?.container ?? currentContainer;
    const hooks =
      container === currentContainer ? currentHooks : fromContainer(container);
    const runner =
      container === currentContainer
        ? currentRunner
        : createCurrentRunner(hooks);

    return runner.start(input);
  };

  const brook: Waterfall<I>['brook'] = input => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    return run(input, { container });
  };

  const waterfall = {
    use,
    run,
    brook,
    [WATERFALL_SYMBOL]: true as const,
  };

  return waterfall;
};

export const isWaterfall = (input: any): input is Waterfall<any> =>
  Boolean(input?.[WATERFALL_SYMBOL]);
