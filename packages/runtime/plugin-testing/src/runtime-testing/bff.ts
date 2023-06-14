/* eslint-disable eslint-comments/disable-enable-pair */
import type { SuperTest, Test } from 'supertest';
import supertest from 'supertest';
import { getApp } from '../cli/bff/app';

function request(): SuperTest<Test>;

function request<T extends (...argss: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): Test;

function request(...args: any): SuperTest<Test> | Test {
  const [fn, ...extraArgs] = args;
  const app = getApp();
  if (!fn) {
    return supertest(app);
  }
  fn.returnHttp = true;
  const res = fn(...extraArgs);
  fn.returnHttp = false;
  return res;
}

export { request as testBff };
