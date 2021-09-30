/**
 * Copyright Lucifier129 and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/farrow-js/farrow/blob/master/LICENSE
 *
 */

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Next<I = unknown, O = void> = (input?: I) => O;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type CounterCallback<I = unknown, O = void> = (
  index: number,
  input: I,
  next: Next<I, O>,
) => O;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type Counter<I = unknown, O = void> = {
  start: (input: I) => O;
  dispatch: (index: number, input: I) => O;
};

export const createCounter = <I, O>(
  callback: CounterCallback<I, O>,
): Counter<I, O> => {
  type Dispatch = Counter<I, O>['dispatch'];
  type Start = Counter<I, O>['start'];

  const dispatch: Dispatch = (index, input) => {
    const next = (nextInput = input) => dispatch(index + 1, nextInput);
    return callback(index, input, next);
  };

  const start: Start = input => dispatch(0, input);

  return {
    start,
    dispatch,
  };
};

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncNext<I = unknown, O = void> = (input: I) => Promise<O>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncCounterCallback<I = unknown, O = void> = (
  index: number,
  input: I,
  next: AsyncNext<I, O>,
) => Promise<O>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncCounter<I = unknown, O = void> = {
  start: (input: I) => Promise<O>;
  dispatch: (index: number, input: I) => Promise<O>;
};

export const createAsyncCounter = <I, O>(
  callback: AsyncCounterCallback<I, O>,
): AsyncCounter<I, O> => {
  type Dispatch = AsyncCounter<I, O>['dispatch'];
  type Start = AsyncCounter<I, O>['start'];

  const dispatch: Dispatch = async (index, input) => {
    const next = (nextInput = input) => dispatch(index + 1, nextInput);
    return callback(index, input, next);
  };

  const start: Start = input => dispatch(0, input);

  return {
    start,
    dispatch,
  };
};
