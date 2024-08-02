import { MaybeAsync } from '@modern-js/plugin';

type TransformCb = (tempalte: string) => MaybeAsync<string>;

export function createTransformStream(fn?: TransformCb) {
  const decoder: TextDecoder = new TextDecoder();
  const encoder: TextEncoder = new TextEncoder();
  return new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk);

      const newContent = fn ? await fn(content) : content;

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

    readable = stream.readable;
  }

  return new Response(readable, {
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
  });
}
