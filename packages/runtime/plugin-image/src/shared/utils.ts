export function invariant(
  condition: unknown,
  message: string | Error,
): asserts condition {
  if (!condition) {
    throw message instanceof Error ? message : new Error(message);
  }
}
