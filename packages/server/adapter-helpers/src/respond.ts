import { Stream } from 'stream';
import { Buffer } from 'buffer';
import { Context } from 'koa';
import statuses from 'statuses';

declare module 'koa' {
  interface Response {
    has: (header: string) => boolean;
    _explicitNullBody: boolean;
  }
}

// eslint-disable-next-line max-statements
const respond = <T extends Context>(ctx: T) => {
  if (!ctx.body) {
    // restore statusCode
    if (ctx.res.statusCode === 404) {
      ctx.res.statusCode = 200;
    }
    return;
  }

  if (!ctx.writable) {
    return;
  }

  const { res } = ctx;
  let { body } = ctx;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null;
    // eslint-disable-next-line consistent-return
    return res.end();
  }

  if (ctx.method === 'HEAD') {
    if (!res.headersSent && !ctx.response.has('Content-Length')) {
      const { length } = ctx.response;
      if (Number.isInteger(length)) {
        ctx.length = length;
      }
    }
    // eslint-disable-next-line consistent-return
    return res.end();
  }

  // status body
  if (body == null) {
    if (ctx.response._explicitNullBody) {
      ctx.response.remove('Content-Type');
      ctx.response.remove('Transfer-Encoding');
      ctx.length = 0;
      // eslint-disable-next-line consistent-return
      return res.end();
    }
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body as Buffer);
    }
    // eslint-disable-next-line consistent-return
    return res.end(body);
  }

  // responses
  if (Buffer.isBuffer(body)) {
    // eslint-disable-next-line consistent-return
    return res.end(body);
  }
  if (typeof body === 'string') {
    // eslint-disable-next-line consistent-return
    return res.end(body);
  }
  if (body instanceof Stream) {
    // eslint-disable-next-line consistent-return
    return new Promise(resolve => {
      (body as Stream).pipe(res).on('finish', () => {
        resolve(true);
      });
    });
  }

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body as Buffer);
  }
  res.end(body);
};

export default respond;
