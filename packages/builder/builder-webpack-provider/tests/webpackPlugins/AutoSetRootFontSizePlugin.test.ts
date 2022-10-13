import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import {
  getRootPixelCode,
  genJSTemplate,
  DEFAULT_OPTIONS,
} from '../../src/webpackPlugins/AutoSetRootFontSizePlugin';

const customOptions = {
  ...DEFAULT_OPTIONS,
  widthQueryKey: 'widthKey',
  rootFontSize: 5,
  screenWidth: 750,
  supportLandscape: true,
  useRootFontSizeBeyondMax: true,
};

describe('test getRootPixelCode', () => {
  test('should getRootPixelCode with default options', async () => {
    await expect(getRootPixelCode(DEFAULT_OPTIONS)).resolves.toMatchSnapshot();

    const compressedCode = await getRootPixelCode(DEFAULT_OPTIONS, true);

    expect(compressedCode).toMatchSnapshot();
  });

  test('should getRootPixelCode with custom options', async () => {
    await expect(getRootPixelCode(customOptions)).resolves.toMatchSnapshot();

    const compressedCode = await getRootPixelCode(customOptions, true);

    expect(compressedCode).toMatchSnapshot();
  });
});

describe('test runtime', () => {
  function getDocument() {
    return {
      documentElement: {
        clientWidth: 1024,
        clientHeight: 450,
        style: {
          fontSize: '',
        },
      },
    };
  }

  let document = getDocument();

  let listenerCbs: Array<() => void> = [];

  const addEventListener = vi.fn((_eventName, callback, options) => {
    listenerCbs.push(() => {
      callback(options);
    });
  });

  const runRootPixelCode = (code: string) => {
    // eslint-disable-next-line no-eval
    eval(code);
  };

  beforeEach(() => {
    document = getDocument();
    Object.assign(global, {
      document,
      window: {
        addEventListener,
      },
      location: {},
      screen: {},
    });

    expect(addEventListener).not.toBeCalled();
    expect(document.documentElement.style.fontSize).toBe('');
  });

  afterEach(() => {
    addEventListener.mockClear();
    listenerCbs = [];

    ['document', 'window', 'location', 'screen'].forEach(key => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete global[key];
    });
  });

  test('rem > maxRootFontSize', () => {
    const code = genJSTemplate(DEFAULT_OPTIONS);
    runRootPixelCode(code);
    expect(listenerCbs.length).toBe(1);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    expect(window[DEFAULT_OPTIONS.rootFontSizeVariableName]).toBe(
      DEFAULT_OPTIONS.maxRootFontSize,
    );
    expect(document.documentElement.style.fontSize).toBe(
      `${DEFAULT_OPTIONS.maxRootFontSize}px`,
    );
  });

  test('rem < maxRootFontSize', async () => {
    const code = genJSTemplate(customOptions);

    runRootPixelCode(code);

    expect(document.documentElement.style.fontSize).toBe(
      `${(1024 * 5) / 750}px`,
    );

    document.documentElement.clientWidth = 555;

    // trigger resize
    listenerCbs.forEach(cb => cb());

    // wait
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(document.documentElement.style.fontSize).toBe(
      `${(555 * 5) / 750}px`,
    );
  });

  test('rem use widthQueryKey', () => {
    const code = genJSTemplate(customOptions);

    location.search = '?widthKey=512';

    runRootPixelCode(code);

    expect(document.documentElement.style.fontSize).toBe(
      `${(512 * 5) / 750}px`,
    );
  });

  test('rem use clientHight', () => {
    const code = genJSTemplate(customOptions);

    window.orientation = 91;

    runRootPixelCode(code);

    expect(document.documentElement.style.fontSize).toBe(
      `${(450 * 5) / 750}px`,
    );
  });
});
