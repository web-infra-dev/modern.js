/* eslint-disable no-undef */

const { join } = require('path');
const { fs } = require('@modern-js/utils');
const {
  modernBuild,
  getPort,
  modernServe,
  // launchApp,
  killApp,
  clearBuildDist,
} = require('../../../utils/modernTestUtils');

const { readdir, readFile, remove } = fs;

const fixturesDir = join(__dirname, '../fixtures');

let appPort;
beforeAll(async () => {
  appPort = await getPort();
});

afterAll(() => {
  clearBuildDist(fixturesDir);
});

describe('Basic CSS Module Support', () => {
  const appDir = join(fixturesDir, 'basic-module');

  let app, stdout, code;
  beforeAll(async () => {
    await remove(join(appDir, './dist'));
    ({ code, stdout } = await modernBuild(appDir));

    app = await modernServe(appDir, appPort);
  });
  afterAll(async () => {
    await killApp(app);
  });
  it('should have compiled successfully', () => {
    expect(code).toBe(0);
    // expect(stdout).toMatch(/Compiled successfully/);
    expect(stdout).toContain('.css');
  });

  it(`should've emitted a single CSS file`, async () => {
    const cssFolder = join(appDir, 'dist/static/css');

    const files = await readdir(cssFolder);
    const cssFiles = files.filter(f => /\.css$/.test(f));

    expect(cssFiles.length).toBe(1);
    const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

    expect(cssContent.replace(/\/\*.*?\*\//g, '').trim()).toMatch(
      /\.*\{color:red\}/,
    );
  });
});

describe('module.[less/sass] support', () => {
  const appDir = join(fixturesDir, 'diff-suffix-module');

  let app, stdout, code;
  beforeAll(async () => {
    await remove(join(appDir, './dist'));
    ({ code, stdout } = await modernBuild(appDir));
    app = await modernServe(appDir, appPort);
  });
  afterAll(async () => {
    await killApp(app);
  });

  it('should have compiled successfully', () => {
    expect(code).toBe(0);
    expect(stdout).toContain('.css');
  });
  it('should support less suffix', async () => {
    const cssFolder = join(appDir, 'dist/static/css');

    const files = await readdir(cssFolder);
    const cssFiles = files.filter(f => /\.css$/.test(f));

    expect(cssFiles.length).toBe(1);
    const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

    expect(cssContent.replace(/\/\*.*?\*\//g, '').trim()).toMatch(
      /\.*\{color:green\}/,
    );
  });
  it('should support sass suffix', async () => {
    const cssFolder = join(appDir, 'dist/static/css');

    const files = await readdir(cssFolder);
    const cssFiles = files.filter(f => /\.css$/.test(f));

    expect(cssFiles.length).toBe(1);
    const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

    expect(cssContent.replace(/\/\*.*?\*\//g, '').trim()).toMatch(
      /\.*\{color:blue\}/,
    );
  });
});

describe('Global Module CSS Module Support', () => {
  const appDir = join(fixturesDir, 'global-module');

  let app, code;

  beforeAll(async () => {
    await remove(join(appDir, 'dist'));
    ({ code, stdout } = await modernBuild(appDir, [], {
      stdout: true,
    }));
    app = await modernServe(appDir, appPort);
  });
  afterAll(async () => {
    await killApp(app);
  });

  it('should have compiled successfully', () => {
    // expect(stdout).toMatch(/Compiled successfully/);
    expect(code).toBe(0);
  });

  it(`should've emitted a single CSS file`, async () => {
    const cssFolder = join(appDir, 'dist/static/css');

    const files = await readdir(cssFolder);
    const cssFiles = files.filter(f => /\.css$/.test(f));

    expect(cssFiles.length).toBe(1);
    const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

    expect(cssContent).toMatch(
      /.*\{position:relative\}.* \.bar,.* \.baz\{height:100%;overflow:hidden\}.* \.lol{width:80%}/,
    );
  });
});

// describe('Has CSS Module in computed styles in Development', () => {
//   const appDir = join(fixturesDir, 'dev-module');

//   let app;
//   beforeAll(async () => {
//     await remove(join(appDir, 'dist'));
//     app = await launchApp(appDir, appPort);
//   });
//   afterAll(async () => {
//     await killApp(app);
//   });

//   it('should have CSS for page', async () => {
//     // const page = await global.__BROWSER__.newPage();

//     await page.goto(`http://localhost:${appPort}`);

//     const currentColor = await page.$eval(
//       '#verify-red',
//       node => window.getComputedStyle(node).color,
//     );
//     expect(currentColor).toMatch('rgb(255, 0, 0)');
//   });
// });

describe('Has CSS Module in computed styles in Production', () => {
  const appDir = join(fixturesDir, 'prod-module');

  let app, code;
  beforeAll(async () => {
    await remove(join(appDir, 'dist'));
    ({ code, stdout } = await modernBuild(appDir, [], {
      stdout: true,
    }));
    app = await modernServe(appDir, appPort);
  });
  afterAll(async () => {
    await killApp(app);
  });

  it('should have compiled successfully', () => {
    expect(code).toBe(0);
  });

  it('should have CSS for page', async () => {
    // const page = await global.__BROWSER__.newPage();

    await page.goto(`http://localhost:${appPort}`);
    const currentColor = await page.$eval(
      '#verify-red',
      node => window.getComputedStyle(node).color,
    );
    expect(currentColor).toMatch('rgb(255, 0, 0)');
  });
});

describe('CSS Module Composes Usage (Basic)', () => {
  const appDir = join(fixturesDir, 'composes-basic');

  let stdout;
  beforeAll(async () => {
    await remove(join(appDir, 'dist'));
    ({ code, stdout } = await modernBuild(appDir, [], {
      stdout: true,
    }));
  });

  it('should have compiled successfully', () => {
    expect(code).toBe(0);
    expect(stdout).toContain('.css');
  });

  it(`should've emitted a single CSS file`, async () => {
    const cssFolder = join(appDir, 'dist/static/css');

    const files = await readdir(cssFolder);
    const cssFiles = files.filter(f => /\.css$/.test(f));

    expect(cssFiles.length).toBe(1);
    const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

    expect(cssContent).toMatch(
      /.*\{background:red;color:#ff0\}.*\{background:blue\}/,
    );
  });
});

// FIXME: CSS Module Composes can't compiler normal
// describe('CSS Module Composes Usage (External)', () => {
//   const appDir = join(fixturesDir, 'composes-external');

//   beforeAll(async () => {
//     await remove(join(appDir, 'dist'));
//     await modernBuild(appDir, [], {
//       stdout: true,
//     });
//   });

//   it('should have compiled successfully', () => {
//     expect(code).toBe(0);
//   });

//   it(`should've emitted a single CSS file`, async () => {
//     const cssFolder = join(appDir, 'dist/static/css');

//     const files = await readdir(cssFolder);
//     const cssFiles = files.filter(f => /\.css$/.test(f));

//     expect(cssFiles.length).toBe(1);
//     const cssContent = await readFile(join(cssFolder, cssFiles[0]), 'utf8');

//     expect(cssContent.replace(/\/\*.*?\*\//g, '').trim()).toMatch(
//       /\.other__className--.*\{background:red;color:#ff0\}\.index-module__subClass--.*\{background:blue\}/,
//     );
//   });
// });
/* eslint-enable no-undef */
