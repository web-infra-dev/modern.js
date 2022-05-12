/**
 * modified from https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline
 * license at https://github.com/farrow-js/farrow/blob/master/LICENSE
 */
export type Next<I = unknown, O = unknown> = (input?: I) => O;

export type CounterCallback<I = unknown, O = unknown> = (
  index: number,
  input: I,
  next: Next<I, O>,
) => O;

export type Counter<I = unknown, O = unknown> = {
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
