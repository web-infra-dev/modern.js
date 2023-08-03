import { isObject } from './assert';

export function deepMerge(lower: Record<string, any>, higher: Record<string, any>) {
  if (arguments.length !== 2 || !isObject(lower) || !isObject(higher)) {
    throw Error(`${lower} and ${higher} must be Object`);
  }
  const merged = { ...lower };
  for (const key in higher) {
    const value = higher[key];
    if (value == null) {
      continue;
    }
    const existing = merged[key];
    if (Array.isArray(existing) && Array.isArray(value)) {
      merged[key] = [...existing, ...value];
    } else if (isObject(existing) && isObject(value)) {
      merged[key] = deepMerge(existing, value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}
