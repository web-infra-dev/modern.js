import * as path from 'path';
import { fs } from '@modern-js/utils';
import * as babel from '@babel/core';
import {
  isRes,
  getDistFilePath,
  resolveSourceMap,
  compiler,
} from '../src/compiler';
import { defaultDistFileExtMap } from '../src/constants';

describe('compiler', () => {
  it('isRes', () => {
    const res_1 = isRes({ code: '' });
    expect(res_1).toBe(true);
    const res_2 = isRes(null);
    expect(res_2).toBe(false);
  });

  it('getDistFilePath', () => {
    const distpath_1 = getDistFilePath({
      rootDir: '/project',
      filepath: '/project/src/b.js',
      distDir: '/project/dist',
      extMap: defaultDistFileExtMap,
    });
    expect(path.normalize(distpath_1)).toBe(
      path.normalize('/project/dist/src/b.js'),
    );

    const distpath_2 = getDistFilePath({
      rootDir: '/project/src',
      filepath: '/project/src/b.js',
      distDir: '/project/dist',
      extMap: defaultDistFileExtMap,
    });
    expect(path.normalize(distpath_2)).toBe(
      path.normalize('/project/dist/b.js'),
    );
  });

  it('resolveSourceMap', () => {
    const projectDir = path.join(__dirname, './fixtures/resolveSourceMap');
    fs.removeSync(path.join(projectDir, 'dist'));
    const babelRes = babel.transformFileSync(
      path.join(projectDir, 'src/index.js'),
      { sourceMaps: true, cwd: projectDir },
    );
    const distFilePath = path.join(projectDir, 'dist/far.js');
    const sourcemap_1 = resolveSourceMap({
      babelRes: babelRes as babel.BabelFileResult,
      distFilePath,
      enableVirtualDist: true,
    });
    expect(sourcemap_1.sourceMapPath).toBe(
      path.join(projectDir, 'dist/far.js.map'),
    );
    // TODO test sourcemap content

    const sourcemap_2 = resolveSourceMap({
      babelRes: babelRes as babel.BabelFileResult,
      distFilePath,
    });
    expect(fs.readFileSync(sourcemap_2.sourceMapPath, 'utf-8')).toBe(
      sourcemap_2.sourcemap,
    );
  });

  it('compiler', () => {
    const projectPath = path.join(__dirname, './fixtures/compiler');
    const sourceFilePath = path.join(projectPath, './src/index.js');
    const distPath = path.join(projectPath, 'dist');

    compiler({
      rootDir: path.join(projectPath, 'src'),
      filepath: sourceFilePath,
    });
    expect(fs.existsSync(path.join(distPath, 'index.js'))).toBe(true);
    fs.removeSync(distPath);

    const dist1Path = path.join(projectPath, 'dist1');
    compiler({
      rootDir: path.join(projectPath, 'src'),
      filepath: sourceFilePath,
      distDir: dist1Path,
      babelConfig: { sourceMaps: true },
    });
    expect(fs.existsSync(dist1Path)).toBe(true);
    fs.removeSync(dist1Path);

    compiler({
      rootDir: path.join(projectPath, 'src'),
      filepath: sourceFilePath,
      babelConfig: { sourceMaps: true },
    });
    expect(fs.existsSync(path.join(distPath, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(distPath, 'index.js.map'))).toBe(true);
    fs.removeSync(distPath);

    compiler({
      rootDir: path.join(projectPath, 'src'),
      filepath: sourceFilePath,
      enableVirtualDist: true,
      babelConfig: { sourceMaps: true },
    });
    expect(fs.existsSync(path.join(distPath, 'index.js'))).toBe(false);
    expect(fs.existsSync(path.join(distPath, 'index.js.map'))).toBe(false);
    fs.removeSync(distPath);
  });
});
