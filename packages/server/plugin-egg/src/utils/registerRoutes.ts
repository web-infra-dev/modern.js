import { HttpMethod, useAPIHandlerInfos } from '@modern-js/bff-utils';
import { isSchemaHandler, InputType } from '@modern-js/bff-runtime';
import type { Context, Router } from 'egg';
import typeIs from 'type-is';
import formidable from 'formidable';
import { sortDynamicRoutes } from '@modern-js/adapter-helpers';
import { createDebugger } from '@modern-js/utils';
import { run } from '../context';

const debug = createDebugger('plugin-egg');

const registerRoutes = (router: Router, prefix?: string) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handlerInfos = useAPIHandlerInfos();
  sortDynamicRoutes(handlerInfos);
  if (prefix) {
    router.prefix(prefix);
  }
  handlerInfos.forEach(({ handler, method, name }: any) => {
    const wrapedHandler = async (ctx: Context) => {
      const input = await getInputFromRequest(ctx);

      if (isSchemaHandler(handler)) {
        const result = await run(ctx, () => handler(input));
        if (result.type !== 'HandleSuccess') {
          if (result.type === 'InputValidationError') {
            // eslint-disable-next-line require-atomic-updates
            ctx.status = 400;
          } else {
            // eslint-disable-next-line require-atomic-updates
            ctx.status = 500;
          }
          // eslint-disable-next-line require-atomic-updates
          ctx.body = result.message;
        } else {
          // eslint-disable-next-line require-atomic-updates
          ctx.body = result.value;
        }
      } else {
        const args = Object.values(input.params as any).concat(input);
        // eslint-disable-next-line require-atomic-updates
        ctx.type = 'json';
        // eslint-disable-next-line require-atomic-updates
        ctx.body = await run(ctx, () => handler(...args));
      }
    };

    Object.defineProperties(
      wrapedHandler,
      Object.getOwnPropertyDescriptors(handler),
    );

    if (isNormalMethod(method)) {
      const routeName = method.toLowerCase();
      debug('route', routeName, name);
      (router as any)[routeName](name, wrapedHandler);
    } else {
      throw new Error(`Unknown HTTP Method: ${method}`);
    }
  });
};

const isNormalMethod = (method: string): method is HttpMethod =>
  Object.keys(HttpMethod).includes(method);

export default registerRoutes;

const getInputFromRequest = async (ctx: Context): Promise<InputType> => {
  const draft: Record<string, any> = {
    params: ctx.params,
    query: ctx.query,
    headers: ctx.headers,
    cookies: ctx.headers.cookie,
  };

  if (typeIs.is(ctx.request.type, ['application/json'])) {
    draft.data = ctx.request.body;
  } else if (typeIs.is(ctx.request.type, ['multipart/form-data'])) {
    draft.formData = await resvoleFormData(ctx);
  } else if (
    typeIs.is(ctx.request.type, ['application/x-www-form-urlencoded'])
  ) {
    draft.formUrlencoded = ctx.request.body;
  } else {
    draft.body = ctx.request.body;
  }

  return draft as any;
};

const resvoleFormData = (ctx: Context): Promise<Record<string, any>> => {
  const form = formidable({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(ctx.req, (err, fields, files) => {
      if (err) {
        reject(err);
      }

      resolve({
        ...fields,
        ...files,
      });
    });
  });
};
