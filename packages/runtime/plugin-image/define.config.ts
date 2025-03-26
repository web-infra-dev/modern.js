export interface CreateDefinesOptions {
  test?: boolean;
}

export function createDefines(
  options: CreateDefinesOptions = {},
): Record<string, string> {
  const { test = false } = options;
  return {
    IS_TEST: JSON.stringify(test),
  };
}
