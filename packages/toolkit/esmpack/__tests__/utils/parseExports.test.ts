import { parseExportVariableNamesFromCJSorUMDFile } from '../../src/utils/parseExports';
import { resolveFromFixture } from '../paths';

describe('parseExportVariableNamesFromCJSorUMDFile', () => {
  it('should work with module.exports', async done => {
    const targetPath = 'esm/module-exports.js';
    const result = await parseExportVariableNamesFromCJSorUMDFile(
      resolveFromFixture(targetPath),
    );
    expect(result).toEqual(['a']);
    done();
  });

  it('should work with exports', async done => {
    const targetPath = 'esm/exports.js';
    const result = await parseExportVariableNamesFromCJSorUMDFile(
      resolveFromFixture(targetPath),
    );
    expect(result).toEqual(['a']);
    done();
  });

  it('should work with __exportStart', async done => {
    const targetPath = 'esm/reexport-with-exportStar/index.js';
    const result = await parseExportVariableNamesFromCJSorUMDFile(
      resolveFromFixture(targetPath),
    );
    expect(result).toEqual(['a', 'b']);
    done();
  });

  it('should work with UMD', async done => {
    const targetPath = 'esm/export-as-umd/index.js';
    const result = await parseExportVariableNamesFromCJSorUMDFile(
      resolveFromFixture(targetPath),
    );
    expect(result).toEqual(['umd']);
    done();
  });

  it('should work with minified UMD', async done => {
    const targetPath = 'esm/export-as-umd/index.min.js';
    const result = await parseExportVariableNamesFromCJSorUMDFile(
      resolveFromFixture(targetPath),
    );
    expect(result).toEqual(['umd', 'min']);
    done();
  });
});
