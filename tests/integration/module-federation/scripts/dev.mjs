import { startLab } from './lab.mjs';
const lab = await startLab(
  process.argv.includes('--production') ? 'production' : 'dev',
  true,
);
console.log(`Federation lab: ${lab.url}`);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await lab.stop();
    process.exit(0);
  });
