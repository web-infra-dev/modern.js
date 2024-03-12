import type { MaybeAsync } from '@modern-js/plugin';

export function createTransformStream(
  fn: (content: string) => MaybeAsync<string>,
) {
  // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-decoder
  const decoder: TextDecoder = new TextDecoder();
  // eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-encoder
  const encoder: TextEncoder = new TextEncoder();
  return new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk);

      const newContent = await fn(content);

      controller.enqueue(encoder.encode(newContent));
    },
  });
}
