import path from 'path';
import { gather } from '../src/index';

describe('@modern-js/server-utils', () => {
  it('should work well', () => {
    const pwd = path.resolve(__dirname, './fixtures');
    const result = gather(pwd);

    expect(result.api.length).toBe(1);
    expect(result.api[0]).toBe('@koa/api');
    expect(result.web.length).toBe(1);
    expect(result.web[0]).toBe('@koa/web');
  });

  it('should get empty when pass a empty dir', () => {
    const pwd = path.resolve(__dirname, './fixtures/empty');
    const result = gather(pwd);

    expect(result.api.length).toBe(0);
    expect(result.web.length).toBe(0);
  });
});
