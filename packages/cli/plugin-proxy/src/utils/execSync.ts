import { execSync as nodeExecSync } from 'child_process';

function execSync(cmd: string) {
  let stdout;
  let status = 0;
  try {
    stdout = nodeExecSync(cmd);
  } catch (err: any) {
    stdout = err.stdout;
    status = err.status;
  }

  return {
    stdout: stdout.toString(),
    status,
  };
}

export default execSync;
