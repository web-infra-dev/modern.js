import { it, expect } from '@rstest/core';
import { reduceViewState, resultProps } from '../src/ui/state';
it('uses structured output and never leaks previous results into a new call', () => {
  const state = reduceViewState(
    { cancelled: false },
    {
      type: 'result',
      result: { content: [], structuredContent: { todos: ['a'] } },
    },
  );
  expect(resultProps(state.result)).toEqual({ todos: ['a'] });
  expect(reduceViewState(state, { type: 'input' })).toEqual({
    cancelled: false,
  });
  expect(reduceViewState(state, { type: 'cancelled' })).toEqual({
    cancelled: true,
  });
  expect(reduceViewState(state, { type: 'teardown' })).toEqual({
    cancelled: false,
  });
  expect(
    resultProps({
      content: [],
      structuredContent: { secret: true },
      isError: true,
    }),
  ).toEqual({});
});
