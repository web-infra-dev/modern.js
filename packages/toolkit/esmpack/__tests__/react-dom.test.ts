import path from 'path';
import { fs } from '@modern-js/utils';
import { esmpack } from '../src';
import { preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

it('should work with react-dom', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'react-dom', '17.0.1');
  let hasError = false;
  try {
    await esmpack({
      specifier: 'react-dom',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
    throw e;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'react-dom.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
});

it('should work with react-dom/server', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'react-dom', '17.0.1');
  let hasError = false;
  try {
    await esmpack({
      specifier: 'react-dom/server',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
    throw e;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(distDir, 'react-dom/server.js');
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
});
