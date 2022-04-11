import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

it('should work with rc-switch', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'rc-switch', '3.2.2');
  let hasError = false;
  try {
    await esmpack({
      specifier: 'rc-switch',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'rc-switch.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
}, 10000);
