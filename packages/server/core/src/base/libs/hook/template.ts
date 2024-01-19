/* eslint-disable node/prefer-global/text-encoder */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable node/prefer-global/text-decoder */
import { HonoContext } from '../../types';

const RegList = {
  before: {
    head: '<head[^>]*>',
    body: '<body[^>]*>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

export class TemplateApi {
  private c: HonoContext;

  private res: Response;

  private decoder: TextDecoder = new TextDecoder();

  private encoder: TextEncoder = new TextEncoder();

  constructor(c: HonoContext) {
    this.c = c;
    this.res = c.res;
  }

  set(content: string) {
    const { status, headers } = this.res;
    Promise.resolve(
      this.c.html(content, {
        status,
        headers,
      }),
    ).then(r => {
      this.c.res = r;
    });
  }

  // FIXME: break change
  get(): string {
    return this.res.text() as unknown as string;
  }

  prependHead(fragment: string) {
    const { head } = RegList.before;
    this.transformBody(chunk => {
      return chunk.replace(
        new RegExp(head),
        beforeHead => `${beforeHead}${fragment}`,
      );
    });
  }

  appendHead(fragment: string) {
    const { head } = RegList.after;
    this.transformBody(chunk => {
      return chunk.replace(head, `${fragment}${head}`);
    });
  }

  prependBody(fragment: string) {
    const { body } = RegList.before;
    this.transformBody(chunk => {
      return chunk.replace(
        new RegExp(body),
        beforeBody => `${beforeBody}${fragment}`,
      );
    });
  }

  appendBody(fragment: string) {
    const { body } = RegList.after;
    this.transformBody(chunk => {
      return chunk.replace(body, `${fragment}${body}`);
    });
  }

  private transformBody(cb: (chunk: string) => string) {
    const transformStream = new TransformStream({
      transform: (chunk, controller) => {
        const htmlChunk = this.decoder.decode(chunk);

        const newHtmlChunk = cb(htmlChunk);
        controller.enqueue(this.encoder.encode(newHtmlChunk));
      },
    });

    this.res.body?.pipeThrough(transformStream);

    this.res = this.c.newResponse(transformStream.readable, {
      status: this.res.status,
      headers: this.res.headers,
    });
  }
}
