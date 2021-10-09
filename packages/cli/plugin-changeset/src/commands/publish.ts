import { getPackageManager } from '@modern-js/utils';
import { execaWithStreamLog } from '../utils';

interface PublishOptions {
  tag: string;
}
export async function publish(options: PublishOptions) {
  const packageManager = getPackageManager(process.cwd());

  const { tag } = options;
  const params = ['publish', '-r', '--ignore-scripts'];

  if (tag) {
    params.push('--tag');
    params.push(tag);
  }

  await execaWithStreamLog(packageManager, params);
}
