import path from 'path';
import { fs } from '../compiled';
import { normalizeOutputPath } from './path';

const memo = <T extends (...args: any[]) => any>(fn: T) => {
  const cache = new Map();

  return (...params: Parameters<T>): ReturnType<T> => {
    const stringifiedParams = JSON.stringify(params);
    const cachedResult = cache.get(stringifiedParams);

    if (cachedResult) {
      return cachedResult;
    }

    const res = fn(...params);
    cache.set(stringifiedParams, res);

    return res;
  };
};
