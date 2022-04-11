import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

it('should work with xlsx', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'xlsx', '0.14.5');
  let hasError = false;
  try {
    await esmpack({
      specifier: 'xlsx',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'xlsx.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
}, 10000);
