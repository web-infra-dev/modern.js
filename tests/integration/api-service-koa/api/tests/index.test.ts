import { testBff } from '@modern-js/runtime/testing/bff';

describe('basic usage', () => {
  it('should support get', async () => {
    const { get } = await import('..');
    const data = await get();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });

  it('should support testBff', async () => {
    const { get } = await import('..');
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
