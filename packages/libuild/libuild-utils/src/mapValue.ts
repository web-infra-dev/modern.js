export function mapValue<T = any, U = any>(obj: Record<string, T>, mapper: (x: T) => U): Record<string, U> {
  if (typeof obj !== 'object') {
    throw Error('type error, `obj` must be a object.');
  }
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, mapper(value)]));
}
