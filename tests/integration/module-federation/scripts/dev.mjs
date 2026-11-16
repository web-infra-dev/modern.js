import { startLab } from './lab.mjs';
const updates = process.argv
  .find(argument => argument.startsWith('--updates='))
  ?.slice('--updates='.length);
const lab = await startLab(
  process.argv.includes('--production') ? 'production' : 'dev',
  true,
  undefined,
  '',
  false,
  { updates },
);
console.log(`Weather Lab: ${lab.url}${updates ? '/updates' : ''}`);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await lab.stop();
    process.exit(0);
  });
