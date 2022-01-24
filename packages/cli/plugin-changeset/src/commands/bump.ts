import { CHANGESET_PATH, execaWithStreamLog } from '../utils';

interface BumpOptions {
  snapshot: boolean | string;
  canary: boolean;
  preid: string;
  ignore: string[];
}
export async function bump(options: BumpOptions) {
  const { snapshot, canary, preid, ignore } = options;

  const params = [CHANGESET_PATH, 'version'];

  if (snapshot) {
    params.push('--snapshot');
    if (typeof snapshot === 'string') {
      params.push(snapshot);
    }
  }

  if (ignore) {
    ignore.forEach(pkg => {
      params.push('--ignore');
      params.push(pkg);
    });
  }

  if (canary) {
    await execaWithStreamLog(process.execPath, [
      CHANGESET_PATH,
      'pre',
      'enter',
      preid || 'next',
    ]);
    try {
      await execaWithStreamLog(process.execPath, params);
      await execaWithStreamLog(process.execPath, [
        CHANGESET_PATH,
        'pre',
        'exit',
      ]);
    } catch (e) {
      await execaWithStreamLog(process.execPath, [
        CHANGESET_PATH,
        'pre',
        'exit',
      ]);
    }
  } else {
    await execaWithStreamLog(process.execPath, params);
  }
}
