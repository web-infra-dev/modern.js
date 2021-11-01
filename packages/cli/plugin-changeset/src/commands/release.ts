import { CHANGESET_PATH, execaWithStreamLog } from '../utils';

interface PublishOptions {
  tag: string;
  ignoreScripts: boolean;
}
export async function release(options: PublishOptions) {
  const params = ['publish'];

  const { tag } = options;

  if (tag) {
    params.push('--tag');
    params.push(tag);
  }

  await execaWithStreamLog('node', [CHANGESET_PATH, ...params]);
}
