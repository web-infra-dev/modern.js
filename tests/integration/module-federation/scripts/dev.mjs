import { rm } from 'node:fs/promises';
import { startLab } from './lab.mjs';
import { createWorkspace } from './workspace.mjs';

const full = process.argv.includes('--full');
const updates = process.argv
  .find(argument => argument.startsWith('--updates='))
  ?.slice('--updates='.length);

const labs = [];
const workspaces = [];
async function stopAll() {
  await Promise.allSettled(labs.map(lab => lab.stop()));
  await Promise.allSettled(
    workspaces.map(dir =>
      rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }),
    ),
  );
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, async () => {
    await stopAll();
    process.exit(0);
  });

if (full) {
  const devPorts = {
    host: 4300,
    provider: 4301,
    nested: 4302,
    library: 4303,
    providerV2: 4304,
    libraryV2: 4305,
    api: 4306,
    hostInternal: 4307,
  };
  const devPartialPorts = {
    ...devPorts,
    host: 4310,
    hostInternal: 4317,
  };
  const prodPorts = {
    host: 4320,
    provider: 4321,
    nested: 4322,
    library: 4323,
    providerV2: 4324,
    libraryV2: 4325,
    api: 4326,
    hostInternal: 4327,
  };
  const prodPartialPorts = {
    host: 4330,
    provider: 4331,
    nested: 4332,
    library: 4333,
    providerV2: 4334,
    libraryV2: 4335,
    api: 4336,
    hostInternal: 4337,
  };
  const env = {
    MF_LAB_DEV_ORIGIN: `http://localhost:${devPorts.host}`,
    MF_LAB_DEV_PARTIAL_ORIGIN: `http://localhost:${devPartialPorts.host}`,
    MF_LAB_UPDATE_ORIGIN: `http://localhost:${prodPorts.host}`,
    MF_LAB_PARTIAL_ORIGIN: `http://localhost:${prodPartialPorts.host}`,
  };
  try {
    console.log('Starting Dev (application update)...');
    const devGlobal = await startLab('dev', false, undefined, '', false, {
      updates: 'all',
      serviceNested: true,
      ports: devPorts,
      env,
    });
    labs.push(devGlobal);

    console.log('Starting Dev (partial entries update)...');
    const devPartialWorkspace = await createWorkspace({ updates: 'ordinary' });
    workspaces.push(devPartialWorkspace);
    const devPartial = await startLab(
      'dev',
      false,
      devPartialWorkspace,
      '',
      false,
      {
        updates: 'ordinary',
        ssrScope: 'entries',
        hostOnly: true,
        ports: devPartialPorts,
        env,
      },
    );
    labs.push(devPartial);

    console.log(
      'Building & starting Build + serve (application update + memory)...',
    );
    const prodWorkspace = await createWorkspace({ updates: 'ordinary' });
    workspaces.push(prodWorkspace);
    const prodGlobal = await startLab(
      'production',
      false,
      prodWorkspace,
      '',
      false,
      {
        updates: 'ordinary',
        serviceNested: true,
        ports: prodPorts,
        env,
      },
    );
    labs.push(prodGlobal);

    console.log(
      'Building & starting Build + serve (partial entries update + memory)...',
    );
    const prodPartialWorkspace = await createWorkspace({ updates: 'ordinary' });
    workspaces.push(prodPartialWorkspace);
    const prodPartial = await startLab(
      'production',
      false,
      prodPartialWorkspace,
      '',
      false,
      {
        updates: 'ordinary',
        ssrScope: 'entries',
        ports: prodPartialPorts,
        env,
      },
    );
    labs.push(prodPartial);

    console.log('\nWeather Lab (full linked environments) ready:');
    console.log(
      `  Dev · Application update:     ${devGlobal.url}/?lab=ssr&tab=hmr`,
    );
    console.log(
      `  Dev · Partial update:         ${devPartial.url}/?lab=ssr&tab=hmr`,
    );
    console.log(
      `  Dev · Service HMR:            ${devGlobal.url}/service/forecast/today?lab=service&tab=hmr`,
    );
    console.log(
      `  Build · Application & memory: ${prodGlobal.url}/?lab=ssr&tab=cache`,
    );
    console.log(
      `  Build · Partial & memory:     ${prodPartial.url}/?lab=ssr&tab=cache`,
    );
    console.log(
      `  Build · Service & memory:     ${prodGlobal.url}/service/forecast/today?lab=service&tab=cache`,
    );
  } catch (error) {
    await stopAll();
    throw error;
  }
} else {
  const lab = await startLab(
    process.argv.includes('--production') ? 'production' : 'dev',
    true,
    undefined,
    '',
    false,
    { updates },
  );
  labs.push(lab);
  const routes = {
    ordinary: '/',
    bridge: '/bridge-ssr/forecast/today',
    service: '/service/forecast/today',
  };
  if (updates === 'all') {
    for (const [scenario, route] of Object.entries(routes))
      console.log(`${scenario}: ${lab.url}${route}`);
  } else console.log(`Weather Lab: ${lab.url}${routes[updates] || '/'}`);
}
