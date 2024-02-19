import { MaybeAsync } from '@modern-js/plugin';

export const getRuntimeEnv = () => {
  if (global?.process?.release?.name === 'node') {
    return 'node';
  }
  return 'other';
};

export const checkIsProd = () => {
  const env = getRuntimeEnv();

  switch (env) {
    case 'node':
      return process.env.NODE_ENV === 'production';

    default:
      return false;
  }
};

export type CollectMiddlewaresResult = {
  web: any[];
  api: any[];
};

export const mergeExtension = (users: any[]) => {
  const output: any[] = [];
  return { middleware: output.concat(users) };
};

export const createMiddlewareCollecter = () => {
  const webMiddlewares: any[] = [];
  const apiMiddlewares: any[] = [];

  const addWebMiddleware = (input: any) => {
    webMiddlewares.push(input);
  };

  const addAPIMiddleware = (input: any) => {
    apiMiddlewares.push(input);
  };

  const getMiddlewares = (): CollectMiddlewaresResult => ({
    web: webMiddlewares,
    api: apiMiddlewares,
  });
  return {
    getMiddlewares,
    addWebMiddleware,
    addAPIMiddleware,
  };
};

const ERROR_PAGE_TEXT: Record<number, string> = {
  404: 'This page could not be found.',
  500: 'Internal Server Error.',
};

export const createErrorHtml = (status: number) => {
  const text = ERROR_PAGE_TEXT[status] || '';
  const title = `${status}: ${text}`;
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>${title}</title>
    <style>
      html,body {
        margin: 0;
      }

      .page-container {
        color: #000;
        background: #fff;
        height: 100vh;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <div class="page-container">
    <h1>${status}</h1>
    <div>${text}</div>
  </body>
  </html>
  `;
};

// eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-decoder
const decoder: TextDecoder = new TextDecoder();
// eslint-disable-next-line node/no-unsupported-features/node-builtins, node/prefer-global/text-encoder
const encoder: TextEncoder = new TextEncoder();

export function createTransformStream(
  fn: (content: string) => MaybeAsync<string>,
) {
  return new TransformStream({
    async transform(chunk, controller) {
      const content = decoder.decode(chunk);

      const newContent = await fn(content);

      controller.enqueue(encoder.encode(newContent));
    },
  });
}

export function warmup(bundles: Array<string | undefined>) {
  bundles.forEach(bundle => {
    bundle &&
      import(bundle).catch(_ => {
        // ignore errors, if we can't import the bundle
        // such as: the bundle is not exists.
      });
  });
}
