import { testBff } from '@modern-js/runtime/testing';
import get from '..';

describe('hello', () => {
  it('should support get', async () => {
    const data = await get();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  it('should support testBff', async () => {
    await testBff(get)
      .expect('Content-Type', /json/)
      .expect(200, { message: 'Hello Modern.js' });
  });

  it('should support testBff by api', async () => {
    await testBff()
      .post('/api')
      .send()
      .expect(200, { message: 'Hello Modern.js' });
  });
});
