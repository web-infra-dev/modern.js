import { MaybeAsync } from '@modern-js/plugin';

type TransformCb = (tempalte: string) => MaybeAsync<string>;

export function createTransformStream(fn: TransformCb) {
  // eslint-disable-next-line node/prefer-global/text-decoder
  const decoder: TextDecoder = new TextDecoder();
  // eslint-disable-next-line node/prefer-global/text-encoder
  const encoder: TextEncoder = new TextEncoder();
  return new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk);

      const newContent = await fn(content);

      controller.enqueue(encoder.encode(newContent));
    },
  });
}

export function transformResponse(
  response: Response,
  transformCb: Array<TransformCb> | TransformCb,
): Response {
  let readable: ReadableStream | null = null;
  if (response.body) {
    const stream = createTransformStream(async before => {
      if (Array.isArray(transformCb)) {
        return transformCb.reduce(async (before, cb) => {
          return cb(await before);
        }, Promise.resolve(before));
      } else {
        return transformCb(before);
      }
    });

    response.body.pipeThrough(stream);

    // eslint-disable-next-line prefer-destructuring
    readable = stream.readable;
  }

  return new Response(readable, {
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
  });
}
