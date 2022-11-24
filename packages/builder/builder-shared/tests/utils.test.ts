import { describe, expect, it } from 'vitest';
import { awaitableGetter } from '../src';

describe('awaitableGetter', () => {
  it('should work', async () => {
    const arr = ['123', '456'];
    const promises = arr.map(item => Promise.resolve(item));
    const wrapped = awaitableGetter(promises);
    expect(wrapped.promises).toStrictEqual(promises);
    expect(await wrapped).toStrictEqual(arr);
  });
});
