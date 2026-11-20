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
    tornDown: true,
  });
  expect(
    resultProps({
      content: [],
      structuredContent: { secret: true },
      isError: true,
    }),
  ).toEqual({});
});

it('preserves connected-view output during new input and clears it on cancellation and teardown', () => {
  const state = {
    cancelled: false,
    result: { content: [], structuredContent: { todos: ['a'] } },
  };
  expect(reduceViewState(state, { type: 'input', keepResult: true })).toEqual(
    state,
  );
  expect(reduceViewState(state, { type: 'cancelled' })).toEqual({
    cancelled: true,
  });
  expect(reduceViewState(state, { type: 'teardown' })).toEqual({
    cancelled: false,
    tornDown: true,
  });
});

it('does not revive a torn down connected view when a late tool result arrives', () => {
  const state = { cancelled: false, tornDown: true };
  expect(
    reduceViewState(state, {
      type: 'result',
      result: { content: [], structuredContent: { stale: true } },
    }),
  ).toEqual(state);
});
