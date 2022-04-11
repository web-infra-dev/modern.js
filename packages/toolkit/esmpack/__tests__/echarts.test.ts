import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { installPackage } from './npm';
import { getTempDir } from './paths';

it('should work with echarts inline', async done => {
  const workDir = getTempDir();
  await installPackage(workDir, 'echarts', '4.7.0');
  let hasError = false;
  try {
    const compiler = await esmpack({
      cwd: workDir,
    });
    await compiler.run({
      specifier: 'echarts',
      // inlineDependency should be injected via EchartsPlugin
      //   inlineDependency: (id: string) => {
      //     if (id.includes('zrender')) {
      //       return true;
      //     }
      //     return false;
      //   },
    });
  } catch (e) {
    hasError = true;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'echarts.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  const distContent = fs.readFileSync(targetFilePath).toString();
  //   const re = /^import\s\w+\sfrom\s['"]zrender(.*)['"]/;
  //   const containIconsImport = re.test(distContent);
  //   expect(containIconsImport).toBe(false);
  expect(distContent).toMatchSnapshot();
  done();
}, 30000);
