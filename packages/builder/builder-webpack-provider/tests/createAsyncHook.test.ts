import { describe, expect, test } from 'vitest';
import { initHooks } from '../src/core/initHooks';

describe('initHooks', () => {
  test('should init hooks correctly', async () => {
    const hooks = initHooks();
    expect(Object.keys(hooks)).toMatchSnapshot();
  });
});
