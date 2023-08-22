import path from 'path';
import { fs } from '@modern-js/utils';
import { runCli, initBeforeTest } from './utils';

initBeforeTest();

describe('transformLodash', () => {
  const fixtureDir = path.join(__dirname, './fixtures/transformLodash');
  it('build success', async () => {
    const ret = await runCli({
      argv: ['build'],
      configFile: path.join(fixtureDir, 'modern.config.ts'),
      appDirectory: fixtureDir,
    });
    expect(ret.success).toBeTruthy();
  });

  it('should not transform lodash when transformLodash is false', async () => {
    const distFileCJSPath = path.join(fixtureDir, './dist/cjs/a.js');
    const distFileESMPath = path.join(fixtureDir, './dist/esm/a.js');

    expect(fs.existsSync(distFileCJSPath)).toBe(true);
    expect(fs.existsSync(distFileESMPath)).toBe(true);

    const cjsContent = fs.readFileSync(distFileCJSPath, 'utf-8');
    expect(cjsContent).toContain(`require("lodash")`);

    const esmContent = fs.readFileSync(distFileESMPath, 'utf-8');
    expect(esmContent).toContain(`import _ from "lodash";`);
  });

  it('should transform lodash when transformLodash is true', async () => {
    const distFileESMPath = path.join(fixtureDir, './dist/esm/b.js');
    const distFileCJSPath = path.join(fixtureDir, './dist/cjs/b.js');

    expect(fs.existsSync(distFileESMPath)).toBe(true);
    expect(fs.existsSync(distFileCJSPath)).toBe(true);

    const esmContent = fs.readFileSync(distFileESMPath, 'utf-8');
    expect(esmContent).toContain('lodash/map');
    expect(esmContent).toContain('lodash/fp/add');

    const cjsContent = fs.readFileSync(distFileCJSPath, 'utf-8');
    expect(cjsContent).toContain('lodash/map');
    expect(cjsContent).toContain('lodash/fp/add');
  });
});
