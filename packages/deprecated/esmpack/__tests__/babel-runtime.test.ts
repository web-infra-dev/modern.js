import path from 'path';
import { fs } from '@modern-js/utils';
import { Compiler, esmpack } from '../src';
import { Compilation } from '../src/Compilation';
import { preparePackage } from './npm';
import { getTempDir } from './paths';

// jest.setTimeout(60000);

it('should work with @babel/runtime/helpers/arrayLikeToArray', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, '@babel/runtime', '7.13.4');
  let hasError = false;
  try {
    await esmpack({
      specifier: '@babel/runtime/helpers/arrayLikeToArray',
      cwd: workDir,
    });
  } catch (e) {
    hasError = true;
    throw e;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(
    distDir,
    '@babel/runtime/helpers/arrayLikeToArray.js',
  );
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();
  done();
});

it('should work with babel-runtime/helpers/extends', async done => {
  const workDir = getTempDir();
  await preparePackage(workDir, 'babel-runtime', '6.26.0');
  let hasError = false;
  let compiler: Compiler | null = null;
  let compilation: Compilation | null = null;
  try {
    compiler = await esmpack({
      cwd: workDir,
    });
    compilation = await compiler.run({
      specifier: 'babel-runtime/helpers/extends',
    });
  } catch (e) {
    hasError = true;
    throw e;
  }
  expect(hasError).toBe(false);
  const distDir = path.resolve(workDir, 'dist');
  const targetFilePath = path.resolve(
    distDir,
    'babel-runtime/helpers/extends.js',
  );
  expect(compilation.dependencies.length).toEqual(1);
  expect(compilation.dependencies[0].specifier).toEqual(
    'core-js/library/fn/object/assign',
  );
  expect(fs.existsSync(targetFilePath)).toBe(true);
  expect(fs.readFileSync(targetFilePath).toString()).toMatchSnapshot();

  done();
});
