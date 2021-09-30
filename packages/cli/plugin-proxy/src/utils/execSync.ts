import { execSync as nodeExecSync } from 'child_process';

function execSync(cmd: string) {
  let stdout;
  let status = 0;
  try {
    stdout = nodeExecSync(cmd);
  } catch (err: any) {
    /* eslint-disable prefer-destructuring */
    stdout = err.stdout;
    status = err.status;
    /* eslint-enable prefer-destructuring */
  }

  return {
    stdout: stdout.toString(),
    status,
  };
}

export default execSync;
