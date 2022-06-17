import { CHANGESET_PATH, execaWithStreamLog } from '../utils';

interface StatusOptions {
  verbose: boolean;
  output: string;
  since: string;
}

export async function status(options: StatusOptions) {
  const params = [CHANGESET_PATH, 'status'];

  const { verbose, output, since } = options;

  if (verbose) {
    params.push('--verbose');
  }

  if (output) {
    params.push('--output');
    params.push(output);
  }

  if (since) {
    params.push('--since');
    params.push(since);
  }

  await execaWithStreamLog(process.execPath, params);
}
