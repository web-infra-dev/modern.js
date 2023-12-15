import { Transform } from 'stream';
import { MaybeAsync } from '@modern-js/plugin';

export const afterRenderInjectableStream = (
  fn: (content: string) => MaybeAsync<string>,
) =>
  new Transform({
    async write(chunk, _, callback) {
      this.push(await fn(chunk.toString()));
      callback();
    },
  });
