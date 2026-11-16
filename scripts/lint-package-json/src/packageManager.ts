import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export function pnpmInvocation(
  args: string[],
  script = process.env.npm_execpath,
  platform: NodeJS.Platform = process.platform,
) {
  if (script && /(?:^|[\\/])pnpm(?:\.[cm]?js|\.exe)?$/.test(script)) {
    return /\.[cm]?js$/.test(script)
      ? { command: process.execPath, args: [script, ...args], shell: false }
      : { command: script, args, shell: false };
  }
  // Windows npm installations expose pnpm.cmd, which cannot be execFile'd.
  // Prefer the script's installed pnpm entry above, avoiding a shell entirely.
  return platform === 'win32'
    ? {
        command: 'pnpm',
        args: args.map(arg => `"${arg.replaceAll('"', '\\"')}"`),
        shell: true,
      }
    : { command: 'pnpm', args, shell: false };
}

export function runPnpm(
  args: string[],
  options: { cwd: string; maxBuffer?: number },
) {
  const invocation = pnpmInvocation(args);
  return execute(invocation.command, invocation.args, {
    ...options,
    shell: invocation.shell,
  });
}
