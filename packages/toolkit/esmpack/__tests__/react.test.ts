import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

it('should work with react', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'react', '17.0.1');
  let hasError = false;
  try {
    await esmpack({
      specifier: 'react',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'react.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
}, 10000);
