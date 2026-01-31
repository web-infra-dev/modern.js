import path from 'path';
import { execa, fs as fse } from '@modern-js/utils';
import {
  getPort,
  killApp,
  modernBuild,
  runContinuousTask,
} from '../../../utils/modernTestUtils';

const appDir = path.resolve(__dirname, '../');

async function checkAppRun(host: string) {
  // Page render
  const page = await fetch(`${host}/`);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain('<div id="item">');

  // Loader
  const loader = await fetch(`${host}/one?__loader=page&name=name`);
  expect(loader.status).toBe(200);
  expect(await loader.text()).toContain(
    JSON.stringify({ name: 'name', age: 18 }),
  );

  // API
  const api = await fetch(`${host}/api/info`);
  expect(api.status).toBe(200);
  expect(await api.json()).toEqual({
    company: 'bytedance',
    addRes: 3,
    url: '/api/info',
  });
}

// bff project's dependencies is more complex, so use bff project to test
describe('deploy', () => {
  const apps = new Set();

  beforeAll(async () => {
    await modernBuild(appDir, [], {});
  });

  afterAll(async () => {
    await Promise.all([...apps].map(x => killApp(x)));
    await fse.remove(path.join(appDir, '.output'));
    await fse.remove(path.join(appDir, '.output-server-bundle'));
  });

  test('support server when deploy target is node', async () => {
    await execa('npx modern deploy --skip-build', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_BUNDLE_SERVER: 'false',
        MODERNJS_DEPLOY: 'node',
      },
    });
    const outputDirectory = path.join(appDir, '.output');
    const staticDirectory = path.join(outputDirectory, 'static');
    const htmlDirectory = path.join(outputDirectory, 'html');
    const apiFile = path.join(outputDirectory, 'api/lambda/index.js');
    const bootstrapPath = path.join(outputDirectory, 'index.js');

    expect(await fse.pathExists(staticDirectory)).toBe(true);
    expect(await fse.pathExists(htmlDirectory)).toBe(true);
    expect(await fse.pathExists(apiFile)).toBe(true);
    expect(await fse.pathExists(bootstrapPath)).toBe(true);

    // check server run
    const port = await getPort();
    const app = await runContinuousTask(['.output/index.js'], undefined, {
      cwd: appDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port,
      },
      waitMessage: /Server is listening on/i,
    });
    apps.add(app);
    await checkAppRun(`http://localhost:${port}`);
    await killApp(app);
    apps.delete(app);
  });

  test('support server bundle when deploy target is node', async () => {
    await execa('npx modern deploy', {
      shell: true,
      cwd: appDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_BUNDLE_SERVER: 'true',
        MODERNJS_DEPLOY: 'node',
      },
    });
    const outputFile = '.output-server-bundle/bundle.mjs';
    expect(await fse.pathExists(path.join(appDir, outputFile))).toBe(true);

    // check server run
    const port = await getPort();
    const app = await runContinuousTask([outputFile], undefined, {
      cwd: appDir,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: port,
      },
      waitMessage: /Server is listening on/i,
    });
    apps.add(app);
    await checkAppRun(`http://localhost:${port}`);
    await killApp(app);
    apps.delete(app);
  });
});
