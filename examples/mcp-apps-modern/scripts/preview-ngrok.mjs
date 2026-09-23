import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { selectNgrokOrigin } from './select-ngrok-origin.mjs';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const api = process.env.NGROK_API_URL ?? 'http://127.0.0.1:4040';
let active;
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    active?.kill(signal);
  });
}

function run(command) {
  return new Promise((resolve, reject) => {
    active = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      [command],
      {
        cwd,
        env: process.env,
        stdio: 'inherit',
      },
    );
    active.once('error', reject);
    active.once('exit', (code, signal) => {
      active = undefined;
      if (code === 0 || (stopping && signal)) resolve();
      else reject(new Error(`pnpm ${command} exited with ${code ?? signal}`));
    });
  });
}

try {
  const response = await fetch(`${api.replace(/\/+$/, '')}/api/tunnels`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok)
    throw new Error(`ngrok API returned HTTP ${response.status}`);
  const origin = selectNgrokOrigin(await response.json(), port);
  // Never replace an unrelated application already listening on the selected port.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () =>
      reject(
        new Error(
          `Port ${port} is occupied. Stop the existing app before preview:ngrok.`,
        ),
      ),
    );
    probe.listen(port, '127.0.0.1', () =>
      probe.close(error => (error ? reject(error) : resolve())),
    );
  });
  process.env.MCP_UI_ORIGIN = origin;
  process.env.PORT = String(port);
  console.log(`MCP endpoint: ${origin}/mcp`);
  await run('build');
  if (!stopping) await run('serve');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(
    `Start ngrok separately: ngrok http ${port} --host-header=rewrite`,
  );
  process.exitCode = 1;
}
