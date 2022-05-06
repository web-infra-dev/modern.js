import { IncomingHttpHeaders } from 'http';
import url from 'url';

export function namespaceHash(namespace: string, hash: string) {
  return `${namespace}/${hash}`;
}

export function fname(lv: number) {
  return `f${lv}`;
}

export function connectFactor(...args: string[]) {
  return args.join('-');
}

export function valueFactory(obj: url.URLSearchParams | IncomingHttpHeaders) {
  if (obj instanceof url.URLSearchParams) {
    return function (key: string) {
      return obj.get(key);
    };
  } else {
    return function (key: string) {
      const value = obj[key];
      if (Array.isArray(value)) {
        return value.join(',');
      }
      return value;
    };
  }
}

export function getTime([s, ns]: [number, number]): number {
  return Math.floor(s * 1e3 + ns / 1e6);
}

const RE_START_IN_HEAD = /<head>/;
export function cacheAddition(html: string, hash: string) {
  const additionHtml = html.replace(
    RE_START_IN_HEAD,
    `<head><meta name="x-moden-spr" content="${hash}">`,
  );
  return additionHtml;
}

type CoalescedInvoke<T> = {
  isOrigin: boolean;
  value: T;
};

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
const globalInvokeCache = new Map<string, Promise<CoalescedInvoke<unknown>>>();
export function withCoalescedInvoke<F extends (...args: any[]) => Promise<any>>(
  func: F,
): (
  key: string,
  args: Parameters<F>,
) => Promise<CoalescedInvoke<UnwrapPromise<ReturnType<F>>>> {
  return async function (key: string, args: Parameters<F>) {
    const entry = globalInvokeCache.get(key);
    if (entry) {
      return entry.then(res => ({
        isOrigin: false,
        value: res.value as UnwrapPromise<ReturnType<F>>,
      }));
    }

    function __wrapper() {
      return func(...args);
    }

    const future = __wrapper()
      .then(res => {
        globalInvokeCache.delete(key);
        return { isOrigin: true, value: res as UnwrapPromise<ReturnType<F>> };
      })
      .catch(err => {
        globalInvokeCache.delete(key);
        throw err;
      });
    globalInvokeCache.set(key, future);
    return future;
  };
}

export function maybeSync(fn: () => Promise<any>) {
  return (sync: boolean) => {
    if (sync) {
      return fn();
    } else {
      fn();
      return Promise.resolve();
    }
  };
}
