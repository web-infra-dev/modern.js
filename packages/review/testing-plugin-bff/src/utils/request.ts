/* eslint-disable eslint-comments/disable-enable-pair */
import type { SuperTest, Test } from 'supertest';
import supertest from 'supertest';

function request(): SuperTest<Test>;

function request<T extends (...argss: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): Test;

function request(...args: any): SuperTest<Test> | Test {
  const [fn, ...extraArgs] = args;

  if (!fn) {
    return supertest((global as any).app);
  }

  fn.returnHttp = true;
  const res = fn(...extraArgs);
  fn.returnHttp = false;

  return res;
}

export { request };
