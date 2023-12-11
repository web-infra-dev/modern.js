export function assert(
  value: unknown,
  message?: string | Error,
): asserts value {
  if (!value) {
    if (message instanceof Error) {
      throw message;
    } else {
      throw new Error(message ?? 'ASSERT_ERROR');
    }
  }
}
