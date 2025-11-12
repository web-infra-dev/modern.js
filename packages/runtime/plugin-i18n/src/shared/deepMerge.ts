function isPlainObject(value: any): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

export function deepMerge<T extends Record<string, any>>(
  defaultOptions: T,
  userOptions?: Partial<T>,
): T {
  if (!userOptions) {
    return defaultOptions;
  }

  const merged: Record<string, any> = { ...defaultOptions };

  for (const key in userOptions) {
    const userValue = userOptions[key];
    if (userValue === undefined) {
      continue;
    }

    const defaultValue = merged[key];
    const isUserValueObject = isPlainObject(userValue);
    const isDefaultValueObject = isPlainObject(defaultValue);

    if (isUserValueObject && isDefaultValueObject) {
      merged[key] = deepMerge(defaultValue, userValue);
    } else {
      merged[key] = userValue;
    }
  }

  return merged as T;
}
