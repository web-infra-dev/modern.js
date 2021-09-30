export function isString(str: any): str is string {
  return typeof str === 'string';
}

export function isUndefined(obj: any): obj is undefined {
  return typeof obj === 'undefined';
}

export function isArray(obj: any): obj is any[] {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(func: any): func is Function {
  return typeof func === 'function';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isObject(obj: any): obj is object {
  return typeof obj === 'object';
}

export function isPlainObject(obj: any): obj is Record<string, any> {
  return (
    obj &&
    typeof obj === 'object' &&
    Object.prototype.toString.call(obj) === '[object Object]'
  );
}

export function isPromise(obj: any): obj is Promise<any> {
  /* eslint-disable promise/prefer-await-to-then */
  return (
    Boolean(obj) &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
  /* eslint-enable promise/prefer-await-to-then */
}
