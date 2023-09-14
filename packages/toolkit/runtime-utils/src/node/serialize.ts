/**
 *  MARK: `serialize-javascript` can only be used in browser env, so don't export this module in index.ts.
 *  Only use it through subpath.
 */
import serialize from 'serialize-javascript';

export const serializeJson = (data: any) => {
  return serialize(data, { isJSON: true });
};
