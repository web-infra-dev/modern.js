export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isUndefined(obj: any): obj is undefined {
  return typeof obj === 'undefined';
}

export function isArray(obj: unknown): obj is any[] {
  return Array.isArray(obj);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(func: any): func is Function {
  return typeof func === 'function';
}

export function isObject(obj: unknown): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj: unknown): obj is Record<string, any> {
  return (
    isObject(obj) && Object.prototype.toString.call(obj) === '[object Object]'
  );
}

export function isPromise(obj: any): obj is Promise<any> {
  return (
    Boolean(obj) &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
}

export function isRegExp(obj: any): obj is RegExp {
  return Object.prototype.toString.call(obj) === '[object RegExp]';
}
