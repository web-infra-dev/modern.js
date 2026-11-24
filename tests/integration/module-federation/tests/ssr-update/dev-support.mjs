import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import path from 'node:path';
import getPort from 'get-port';
import treeKill from 'tree-kill';

// CI allocates ephemeral listeners. Supervised local runs use exactly the
// assigned ports, including the federation broker's current fixed port.
export async function allocateDevPorts({
  gateway = false,
  nested = false,
} = {}) {
  const assigned = JSON.parse(process.env.MF_LAB_PORTS || '{}');
  const broker = assigned.broker || process.env.JO_PORT_BROKER;
  if (broker && Number(broker) !== 16322)
    throw new Error(
      'The federation development broker currently requires port 16322',
    );
  const ports = {};
  const names = [
    'host',
    'provider',
    ...(gateway ? ['manifest'] : []),
    ...(nested ? ['middle'] : []),
  ];
  for (const name of names) {
    const allocated =
      assigned[name] || process.env[`JO_PORT_${name.toUpperCase()}`];
    const port = allocated
      ? Number(allocated)
      : await getPort({ exclude: Object.values(ports) });
    if (
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      Object.values(ports).includes(port)
    )
      throw new Error(`Invalid or duplicate development port ${name}: ${port}`);
    ports[name] = port;
  }
  ports.manifest ||= ports.provider;
  return ports;
}

export async function scenarioDirectory(prefix) {
  const parent = process.env.MF_LAB_ARTIFACT_DIR || tmpdir();
  await mkdir(parent, { recursive: true });
  return mkdtemp(path.join(parent, prefix));
}

export async function cleanupScenarioWorkspace(root) {
  await Promise.all(
    ['host', 'provider', 'middle', 'browser-profile'].map(name =>
      rm(path.join(root, name), {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      }),
    ),
  );
  if (!process.env.MF_LAB_ARTIFACT_DIR) {
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }
}

export async function stopProcesses(records) {
  await Promise.all(
    records.map(async ({ child }) => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, 'exit');
      await new Promise(resolve =>
        treeKill(child.pid, 'SIGTERM', () => resolve()),
      );
      let timer;
      const stopped = await Promise.race([
        exited.then(() => true),
        new Promise(resolve => {
          timer = setTimeout(() => resolve(false), 5000);
        }),
      ]);
      clearTimeout(timer);
      if (!stopped) {
        await new Promise(resolve =>
          treeKill(child.pid, 'SIGKILL', () => resolve()),
        );
        await exited;
      }
    }),
  );
}
