import path from 'path';
import { loadServerEnv } from '../../src/adapters/node';

describe('test load serve env file', () => {
  const pwd = path.resolve(__dirname, '../fixtures', 'serverEnv');
  const envPwd = path.resolve(__dirname, '../fixtures', 'serverEnvDir');

  it('should load env correctly', async () => {
    await loadServerEnv({
      pwd,
    } as any);

    expect(process.env.USER_NAME).toBe('root');

    delete process.env.USER_NAME;
  });

  it('should load prod env correctly', async () => {
    process.env.MODERN_ENV = 'prod';
    await loadServerEnv({
      pwd,
    } as any);
    expect(process.env.USER_NAME).toBe('prod_root');
    expect(process.env.ENV).toBe('prod');

    delete process.env.USER_NAME;
    delete process.env.ENV;
  });

  it('should load test env correctly', async () => {
    process.env.MODERN_ENV = 'test';
    await loadServerEnv({
      pwd,
    } as any);
    expect(process.env.USER_NAME).toBe('test_root');
    expect(process.env.ENV).toBe('test');

    delete process.env.USER_NAME;
    delete process.env.ENV;
  });

  it('should load env from custom envDir', async () => {
    process.env.MODERN_ENV = 'prod';
    await loadServerEnv({
      pwd: envPwd,
      envDir: 'env',
    } as any);

    expect(process.env.USER_NAME).toBe('dir_prod_root');
    expect(process.env.ENV).toBe('dir_prod');

    delete process.env.USER_NAME;
    delete process.env.ENV;
  });

  it('should fallback to pwd when envDir escapes root', async () => {
    process.env.MODERN_ENV = 'prod';
    await loadServerEnv({
      pwd,
      envDir: '../serverEnvDir/env',
    } as any);

    expect(process.env.USER_NAME).toBe('prod_root');
    expect(process.env.ENV).toBe('prod');

    delete process.env.USER_NAME;
    delete process.env.ENV;
  });
});
