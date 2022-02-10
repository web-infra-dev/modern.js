import { wait } from '../src/wait';

jest.useRealTimers();

describe('wait', () => {
  test('basic usage', async () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const fn3 = async () => {
      fn1();
      await wait();
      fn2();
    };

    fn3();
    expect(fn1).toBeCalled();
    expect(fn2).not.toBeCalled();
    await wait();
    expect(fn2).toBeCalled();
  });

  test('delay', async () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const time = 100;
    const fn3 = async () => {
      fn1();
      await wait(time);
      fn2();
    };

    fn3();
    expect(fn1).toBeCalled();
    expect(fn2).not.toBeCalled();
    await wait(time);
    expect(fn2).toBeCalled();
  });
});
