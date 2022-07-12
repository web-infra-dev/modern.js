import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { installPackage } from './npm';
import { getTempDir } from './paths';

it('should work with antd inline icons', async done => {
  const workDir = getTempDir();
  await installPackage(workDir, 'antd', '4.12.2');
  let hasError = false;
  try {
    const compiler = await esmpack({
      cwd: workDir,
    });
    await compiler.run({
      specifier: 'antd',
      inlineDependency: (id: string) => {
        if (id.includes('@ant-design/icons')) {
          return true;
        }
        return false;
      },
    });
  } catch (e) {
    hasError = true;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'antd.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  const distContent = fs.readFileSync(targetFilePath).toString();
  const re = /import\s\w+\sfrom\s['"]@ant-design\/icons\/es\/icons\/\w+[']/;
  const containIconsImport = re.test(distContent);
  expect(containIconsImport).toBe(false);
  expect(distContent).toMatchSnapshot();
  done();
}, 30000);
