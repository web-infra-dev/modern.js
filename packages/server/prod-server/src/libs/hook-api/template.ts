import { Transform } from 'stream';

const RegList = {
  before: {
    head: '<head>',
    body: '<body>',
  },
  after: {
    head: '</head>',
    body: '</body>',
  },
};

export class TemplateAPI {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  public get() {
    return this.content;
  }

  public set(content: string) {
    this.content = content;
  }

  public prependHead(fragment: string) {
    const { head } = RegList.before;
    return this.replace(head, `${head}${fragment}`);
  }

  public appendHead(fragment: string) {
    const { head } = RegList.after;
    return this.replace(head, `${fragment}${head}`);
  }

  public prependBody(fragment: string) {
    const { body } = RegList.before;
    return this.replace(body, `${body}${fragment}`);
  }

  public appendBody(fragment: string) {
    const { body } = RegList.after;
    return this.replace(body, `${fragment}${body}`);
  }

  private replace(reg: RegExp | string, text: string) {
    this.content = this.content.replace(reg, text);
  }
}

export const templateInjectableStream = ({
  prependHead,
  appendHead,
  prependBody,
  appendBody,
}: {
  prependHead?: string;
  appendHead?: string;
  prependBody?: string;
  appendBody?: string;
}) =>
  new Transform({
    write(chunk, _, callback) {
      let chunk_str: string = chunk.toString();

      if (prependHead) {
        const { head } = RegList.before;
        chunk_str = chunk_str.replace(head, `${head}${prependHead}`);
      }

      if (appendHead) {
        const { head } = RegList.after;
        chunk_str = chunk_str.replace(head, `${appendHead}${head}`);
      }

      if (prependBody) {
        const { body } = RegList.before;
        chunk_str = chunk_str.replace(body, `${body}${prependBody}`);
      }

      if (appendBody) {
        const { body } = RegList.after;
        chunk_str = chunk_str.replace(body, `${appendBody}${body}`);
      }
      this.push(chunk_str);
      callback();
    },
  });
