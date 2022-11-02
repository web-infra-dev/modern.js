import { join } from 'path';
import {
  createBuilderAppIcon,
  createBuilderFavicon,
  createBuilderCrossorigin,
} from '../../src/builder/createHtmlConfig';

describe('test create Builder AppIcon Config', () => {
  it('should return a png icon', () => {
    const appContext = {
      appDirectory: `${__dirname}/fixtures`,
    };
    const configDir = 'icons';
    const appIcon = createBuilderAppIcon(configDir, appContext as any);

    expect(appIcon).toBe(join(__dirname, 'fixtures/icons/icon.png'));
  });

  it('should return `undefined`', () => {
    const appContext = {
      appDirectory: __dirname,
    };
    const configDir = 'icons';
    const appIcon = createBuilderAppIcon(configDir, appContext as any);
    expect(appIcon).toBeUndefined();
  });
});

describe('test create Builder Favicon Config', () => {
  it('should return default favicon', () => {
    const appContext = {
      appDirectory: `${__dirname}/fixtures`,
    };
    const configDir = 'icons';
    const favicon = createBuilderFavicon(
      undefined,
      configDir,
      appContext as any,
    );

    expect(favicon).toBe(join(__dirname, 'fixtures/icons/favicon.svg'));
  });

  it('should return pass favicon path', () => {
    const expect_favicon = 'test/dir/icons/xxx.svg';
    const appContext = {
      appDirectory: `${__dirname}/fixtures`,
    };
    const configDir = 'icons';
    const favicon = createBuilderFavicon(
      expect_favicon,
      configDir,
      appContext as any,
    );

    expect(favicon).toBe(expect_favicon);
  });

  it('should return `undefined`', () => {
    const appContext = {
      appDirectory: `${__dirname}`,
    };
    const configDir = 'icons';
    const favicon = createBuilderFavicon(
      undefined,
      configDir,
      appContext as any,
    );

    expect(favicon).toBeUndefined();
  });
});

describe('test create Builder Crossorigin', () => {
  it('should return "anonymous"', () => {
    const scriptExt = {
      custom: {
        test: /\.js$/,
        attribute: 'crossorigin',
        value: 'anonymous',
      },
    };
    const scriptExtConfig = createBuilderCrossorigin(scriptExt);

    expect(scriptExtConfig).toBe('anonymous');
  });

  it('should return `undefined`', () => {
    const scriptExt = {
      custom: {
        sync: 'important',
        defaultAttribute: 'defer',
      },
    };
    const scriptExtConfig = createBuilderCrossorigin(scriptExt);

    expect(scriptExtConfig).toBeUndefined();
  });
});
