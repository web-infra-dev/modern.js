export function invariant(
  condition: unknown,
  message: string | Error,
): asserts condition {
  if (!condition) {
    throw message instanceof Error ? message : new Error(message);
  }
}

export function isModuleNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')
  );
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
