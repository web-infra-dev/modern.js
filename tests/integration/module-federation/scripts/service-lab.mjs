import { writeFile } from 'node:fs/promises';
import { createWorkspace } from './workspace.mjs';
// Service runs always allocate fresh ports, including HMR and the public gateway.
process.env.MF_LAB_SERVICE = '1';
process.env.MF_BUILD_VERSION ||= `service-lab-${Date.now()}`;
const { startLab } = await import('./lab.mjs');
const workspace = await createWorkspace({ service: true });
const lab = await startLab(
  process.argv.includes('--production') ? 'production' : 'dev',
  false,
  workspace,
  '',
  true,
);
const info = {
  workspace,
  ports: lab.ports,
  processInfo: lab.processInfo,
  apiProcess: process.pid,
  ssr: `http://localhost:${lab.ports.serviceSSR}/service/forecast/wed`,
  csr: `http://localhost:${lab.ports.serviceCSR}/service/forecast/wed`,
};
if (process.env.MF_SERVICE_INFO)
  await writeFile(process.env.MF_SERVICE_INFO, JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await lab.stop();
    process.exit(0);
  });
