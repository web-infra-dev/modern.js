import { esmpack } from '../src';
import { getTempDir, resolveFromFixture } from '../__tests__/paths';
import { transformFilesWithImportMap } from './utils/transform';
import { E2EPlugin } from './utils/e2ePlugin';

test('simple e2e should work', async done => {
  const packages: Record<string, string> = {
    react: '17.0.1',
    'react-dom': '17.0.1',
  };
  const workDir = getTempDir();
  const distDir = resolveFromFixture('dist');
  const compiler = await esmpack({
    cwd: workDir,
    outDir: distDir,
    plugins: [new E2EPlugin(workDir, packages)],
  });

  for (const spec of Object.keys(packages)) {
    await compiler.run({
      specifier: spec,
    });
  }

  const files = compiler.outputFiles.map(f => f.fileLoc);
  const { importMap } = compiler;
  await transformFilesWithImportMap(files, importMap);

  await page.goto('http://localhost:8088/simple');
  await page.waitForSelector('.hello-world');
  const $root = await page.$('#root');
  expect($root).toBeTruthy();
  const targetText = await page.evaluate(el => el.textContent, $root);
  expect(targetText).toEqual('hello world');

  done();
}, 60000);
