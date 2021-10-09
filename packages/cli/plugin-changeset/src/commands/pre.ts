import { CHANGESET_PATH, execaWithStreamLog } from '../utils';

export async function pre(type: 'enter' | 'exit', tag = 'next') {
  const params = [CHANGESET_PATH, 'pre', type];

  if (type === 'enter') {
    params.push(tag);
  }

  await execaWithStreamLog('node', params);
}
