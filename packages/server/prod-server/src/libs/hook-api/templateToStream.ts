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
