// for worker ssr hmr
import { ServerHookRunner } from '@modern-js/prod-server';
import axios from 'axios';
import { mime } from '@modern-js/utils';
import { ModernServerContext } from '@modern-js/types/server';

const PORT = 9230;

export async function workerSSRRender(
  ctx: ModernServerContext,
  renderOptions: {
    urlPath: string;
    [props: string]: any;
  },
  _runner: ServerHookRunner,
) {
  const { headers, params } = ctx;
  const { urlPath } = renderOptions;
  const url = `http://0.0.0.0:${PORT}/${urlPath}`;
  const resposne = await axios.get(url, {
    timeout: 5000,
    responseType: 'text',
    headers: headers as Record<string, any>,
    params,
  });

  return {
    content: resposne.data,
    contentType: mime.contentType('html') as string,
  };
}
