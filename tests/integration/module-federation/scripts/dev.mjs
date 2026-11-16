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
const routes = {
  ordinary: '/',
  bridge: '/bridge-ssr/forecast/today',
  service: '/service/forecast/today',
};
if (updates === 'all') {
  for (const [scenario, route] of Object.entries(routes))
    console.log(`${scenario}: ${lab.url}${route}`);
} else console.log(`Weather Lab: ${lab.url}${routes[updates] || '/'}`);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await lab.stop();
    process.exit(0);
  });
