import { program } from '@modern-js/utils';
import { buildCli } from '../src/cli/build';

describe('[cli] modern build', () => {
  beforeAll(() => {
    jest.mock('../src/commands/build', () => {
      const originalMod = jest.requireActual('../src/commands/build');
      return {
        __esModule: true,
        ...originalMod,
        build: jest.fn(),
      };
    });
  });

  test('default cli options', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(async subCmdOpts => {
      expect(subCmdOpts.watch).toBe(undefined);
      expect(subCmdOpts.tsconfig).toBe('./tsconfig.json');
      expect(subCmdOpts.styleOnly).toBe(undefined);
      expect(subCmdOpts.platform).toBe(undefined);
      expect(subCmdOpts.tsc).toBe(true);
      expect(subCmdOpts.dts).toBe(undefined);
      expect(subCmdOpts.clear).toBe(true);
      expect(subCmdOpts.config).toBe(undefined);
    });
    await p.parseAsync(['', '', 'build']);
  });

  test('modern build -w, --watch', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(async subCmdOpts => {
      expect(subCmdOpts.watch).toBe(true);
    });
    await p.parseAsync(['', '', 'build', '-w']);
    await p.parseAsync(['', '', 'build', '--watch']);
  });

  test('modern build --tsconfig', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.tsconfig).toBe('./tsconfig.json');
    });
    await p.parseAsync(['', '', 'build', '--tsconfig']);
  });

  test('modern build --tsconfig ./tsconfig.build.json', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.tsconfig).toBe('./tsconfig.build.json');
    });
    await p.parseAsync([
      '',
      '',
      'build',
      '--tsconfig',
      './tsconfig.build.json',
    ]);
  });

  test('modern build --style-only', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.styleOnly).toBe(true);
    });
    await p.parseAsync(['', '', 'build', '--style-only']);
  });

  test('modern build --no-tsc', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.tsc).toBe(false);
    });
    await p.parseAsync(['', '', 'build', '--no-tsc']);
  });

  test('modern build --dts', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.dts).toBe(true);
    });
    await p.parseAsync(['', '', 'build', '--dts']);
  });

  test('modern build --no-clear', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.clear).toBe(false);
    });
    await p.parseAsync(['', '', 'build', '--no-clear']);
  });

  test('modern build --platform', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.platform).toBe(true);
    });
    await p.parseAsync(['', '', 'build', '--platform']);
  });

  test('modern build without --platform storybook', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.platform).toBe('storybook');
    });
    await p.parseAsync(['', '', 'build', '--platform', 'storybook']);
  });

  test('modern build -c, --config <config>', async () => {
    const p = program.createCommand();
    buildCli(p, {} as any).action(subCmdOpts => {
      expect(subCmdOpts.config).toBe('./custom.config.js');
    });
    await p.parseAsync(['', '', 'build', '--config', './custom.config.js']);
    await p.parseAsync(['', '', 'build', '-c', './custom.config.js']);
  });

  test('modern build -c, --config', async () => {
    const p = program.createCommand();
    p.exitOverride();
    p.configureOutput({
      // Visibly override write routines as example!
      writeOut: str => str,
      writeErr: str => str,
      // Highlight errors in color.
      outputError: (str, _) => str,
    });

    buildCli(p, {} as any);
    await expect(async () => {
      await p.parseAsync(['', '', 'build', '--config']);
    }).rejects.toThrow();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
});
