export function isEmpty<T>(value: T | null | undefined): value is null {
  return value == null;
}

export function isDef<T>(x: T): x is NonNullable<T> {
  return x !== undefined && x !== null;
}

export function isObject(value: any): value is Record<string | symbol | number, any> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function isEmptyObject(value: any): value is Record<string | symbol | number, any> {
  if (!isObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 0;
}
