export const ensureArray = <T>(params: T | T[]): T[] => {
  if (Array.isArray(params)) {
    return params;
  }
  return [params];
};
