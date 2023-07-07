import { ServerHookRunner } from '@modern-js/prod-server';
import axios from 'axios';
import { mime } from '@modern-js/utils';

const PORT = 9230;

async function sleep(time: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, time);
  });
}

export async function workerSSRRender(
  _ctx: any,
  renderOptions: {
    urlPath: string;
    [props: string]: any;
  },
  _runner: ServerHookRunner,
) {
  const { urlPath } = renderOptions;
  const url = `http://0.0.0.0:${PORT}/${urlPath}`;
  await sleep(1000);
  const resposne = await axios.get(url, {
    timeout: 5000,
    responseType: 'text',
  });

  return {
    content: resposne.data,
    contentType: mime.contentType('html') as string,
  };
}
