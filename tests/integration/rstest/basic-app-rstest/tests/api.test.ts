import { get } from '@api/hello';
import { expect, test } from '@rstest/core';

test('get hello', async () => {
  const res = await get();
  expect(res).toBe('Hello');
});
