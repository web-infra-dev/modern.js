import { spawn } from 'node:child_process';

export async function buildApp(command, args, options) {
  const child = spawn(command, args, options);
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (status, signal) => resolve({ status, signal }));
  });
}
