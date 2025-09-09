import { Api, Get } from '@modern-js/plugin-bff/hono';
import { HTTPException } from 'hono/http-exception';

export default async () => {
  throw new Error('Intentional error in get');
};

export const exceptionManaged = Api(Get('/managed/exception'), async () => {
  throw new HTTPException(401, { message: 'exception with 401' });
});
