import { describe, expect, test, vi } from 'vitest';
import { createAsyncHook } from '../src/createHook';

describe('createAsyncHook', () => {
  test('should execute callback functions in order', async () => {
    const myHook = createAsyncHook();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    myHook.tap(callback1);
    myHook.tap(callback2);
    await myHook.call();
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('should keep params if callback function return void', async () => {
    const myHook = createAsyncHook();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    myHook.tap(callback1);
    myHook.tap(callback2);

    const result = await myHook.call(1);
    expect(result).toEqual([1]);
  });

  test('should allow to modify params in callback function', async () => {
    const myHook = createAsyncHook();
    const callback1 = async () => 2;
    const callback2 = async () => 3;

    myHook.tap(callback1);
    myHook.tap(callback2);

    const result = await myHook.call(1);
    expect(result).toEqual([3]);
  });
});
