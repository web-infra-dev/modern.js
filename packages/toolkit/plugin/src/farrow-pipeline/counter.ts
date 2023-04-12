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
  const dispatch: Counter<I, O>['dispatch'] = (index, input) => {
    const next = (nextInput = input) => dispatch(index + 1, nextInput);
    return callback(index, input, next);
  };
  return {
    start: input => dispatch(0, input),
    dispatch,
  };
};
