import { get as getContext, post as postContext } from '../context';

describe('context', () => {
  it('should support context', async () => {
    const data = await getContext();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  it('should support mock useContext', async () => {
    jest.doMock('@modern-js/runtime/koa', () => {
      return {
        __esModule: true,
        useContext() {
          return {
            message: 'hello',
          };
        },
      };
    });
    const data = await postContext();
    expect(data.message).toEqual('hello');
  });
});
