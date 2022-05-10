import { HMR_SOCK_PATH } from '@modern-js/utils';

// use require to prevent tsconfig linting client code
const { __addQuery__, updateStyle, removeStyle } = require('../src/client');

// const MockedWebSocket = jest.mocked(WebSocket);

describe('plugin-unbundled client test', () => {
  let OriginalWebSocket: any;
  let originalLocation: any;
  let mockOverlayRegistered = false;

  class MockElement extends HTMLElement {
    constructor() {
      super();
      this.className = 'my-custom-mock-element';
    }
  }

  const prepareErrorOverlay = () => {
    jest.spyOn(customElements, 'get').mockImplementation(() => MockElement);
    if (!mockOverlayRegistered) {
      jest
        .mocked(customElements.get)
        .mockImplementationOnce((elementName: string) => {
          customElements.define(elementName, MockElement);
          mockOverlayRegistered = true;
          return MockElement;
        });
    }
  };

  beforeAll(() => {
    OriginalWebSocket = global.WebSocket;
    originalLocation = window.location;
    global.WebSocket = jest.fn(() => ({})) as any;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: jest.fn() },
    });
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    global.WebSocket = OriginalWebSocket;
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    // clean up JSDOM after each test
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('add query test', () => {
    const url = 'https://example.com/api';
    const firstQuery = __addQuery__(url, 'a=1');
    expect(firstQuery).toEqual(`${url}?a=1`);
    const secondQuery = __addQuery__(firstQuery, 'b=2');
    expect(secondQuery).toEqual(`${firstQuery}&b=2`);
  });

  it('test update/remove style', () => {
    const testStyleCode = 'test style';
    const appendChildSpy = jest.spyOn(document.head, 'appendChild');
    const removeChildSpy = jest.spyOn(document.head, 'removeChild');
    const styleId = 225;
    updateStyle(styleId, testStyleCode);

    // should insert style into document
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    const [appendedElement] = appendChildSpy.mock.calls[0] as [
      HTMLStyleElement,
    ];
    expect(appendedElement.nodeName).toEqual('STYLE');
    expect(appendedElement.textContent).toEqual(testStyleCode);

    jest.clearAllMocks();
    // remove style non existing style
    removeStyle(styleId - 1);
    expect(removeChildSpy).not.toHaveBeenCalled();

    removeStyle(styleId);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    const [removedChild] = removeChildSpy.mock.calls[0];
    expect(removedChild).toBe(appendedElement);
  });

  it('test websocket initialization', () => {
    // must use isolate modules to re-import client code for test
    // this is due to client initialization on module load
    jest.isolateModules(() => {
      require('../src/client');
      require('../src/constants');
      expect(jest.mocked(WebSocket).mock.instances).toHaveLength(1);

      // check correct websocket address
      expect(jest.mocked(WebSocket).mock.calls[0][0]).toEqual(
        `${location.origin.replace(/http/, 'ws')}${HMR_SOCK_PATH}`,
      );

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      expect(createdWebSocket).toBeTruthy();

      // check websocket initialized correctly
      expect(createdWebSocket.onmessage).toBeTruthy();
      expect(createdWebSocket.onerror).toBeTruthy();
      expect(createdWebSocket.onclose).toBeTruthy();
    });
  });

  it('test websocket reconnect', () => {
    jest.useFakeTimers();
    jest.isolateModules(() => {
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      jest.mocked(WebSocket).mockClear();
      const someLongTimeDuration = 6000000; // 100 minutes
      jest.advanceTimersByTime(someLongTimeDuration);
      expect(jest.mocked(WebSocket)).not.toHaveBeenCalled();

      // initialization is already tested by previous test
      createdWebSocket.onclose!(new CloseEvent('test close'));
      // do not immediately reconnect, wait a while
      expect(jest.mocked(WebSocket)).not.toHaveBeenCalled();
      jest.advanceTimersByTime(someLongTimeDuration);
      expect(jest.mocked(WebSocket)).toHaveBeenCalled();
    });
  });

  it('test websocket connection error', () => {
    jest.isolateModules(() => {
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      createdWebSocket.onerror!(new Event('test error'));
    });
  });

  // // // TODO: refactor websocket command type to enum
  it('test websocket "connected" message', () => {
    jest.isolateModules(() => {
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      const messageObj = { type: 'connected' };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );
    });
  });

  it('test websocket "reload" message', () => {
    jest.isolateModules(() => {
      require('../src/client');

      expect(window.location.reload).not.toHaveBeenCalled();

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      const messageObj = { type: 'reload' };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );
      expect(window.location.reload).toHaveBeenCalledTimes(1);
    });
  });

  it('test websocket "error" message', () => {
    jest.isolateModules(() => {
      prepareErrorOverlay();
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      let insertedElements = document.querySelectorAll(
        '.my-custom-mock-element',
      );
      expect(insertedElements).toHaveLength(0);

      // initialization is already tested by previous test
      const messageObj = { type: 'error', message: 'this is a test error' };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );

      insertedElements = document.querySelectorAll('.my-custom-mock-element');
      expect(insertedElements).toHaveLength(1);

      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );

      insertedElements = document.querySelectorAll('.my-custom-mock-element');
      expect(insertedElements).toHaveLength(1);
    });
  });

  it('test websocket first "update" on error message', () => {
    jest.isolateModules(() => {
      prepareErrorOverlay();
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      const messageObj: any = {
        type: 'error',
        message: 'this is a test error',
      };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );

      // if there is already a error in first update
      // which meanings some resource load failed
      // so should reload page to ensure app run correctly
      expect(window.location.reload).not.toHaveBeenCalled();
      messageObj.type = 'update';
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );
      expect(window.location.reload).toHaveBeenCalled();

      // set up update message
      messageObj.hmrTimestamp = 123456;
      messageObj.changes = [{ id: 1, accepted: true }];
    });
  });

  it('test "createHotContext"', () => {
    jest.isolateModules(() => {
      const { createHotContext } = require('../src/client');
      const hotmodule = createHotContext('myModule');

      expect(typeof hotmodule.accept).toBe('function');
      expect(typeof hotmodule.decline).toBe('function');
      expect(typeof hotmodule.dispose).toBe('function');
      expect(typeof hotmodule.prune).toBe('function');
      expect(typeof hotmodule.invalidate).toBe('function');

      const pruneFn = jest.fn();
      const disposeFn = jest.fn();
      const acceptFn = jest.fn();
      hotmodule.dispose(disposeFn);
      hotmodule.prune(pruneFn);
      hotmodule.accept(acceptFn);

      const hotmodule2 = createHotContext('myModule2');
      expect(hotmodule2).not.toBe(hotmodule);
      expect(disposeFn).not.toHaveBeenCalled();

      const hotmoduleCopy = createHotContext('myModule');
      expect(hotmoduleCopy).toBe(hotmodule);
      expect(disposeFn).toHaveBeenCalledTimes(1);
      disposeFn.mockClear();
      createHotContext('myModule');
      expect(disposeFn).not.toHaveBeenCalled();
    });
  });

  it('test websocket "prune" message', () => {
    jest.isolateModules(() => {
      prepareErrorOverlay();
      const { createHotContext } = require('../src/client');
      const hotmodule = createHotContext('myModule');
      const pruneFn = jest.fn();
      hotmodule.prune(pruneFn);

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      const messageObj: any = {
        type: 'prune',
        changes: ['myModule'],
      };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );

      expect(pruneFn).toHaveBeenCalledTimes(1);
    });
  });

  it('test websocket "update" hot module', () => {
    // TODO: solve ESM support issue to test dynamic import
  });

  it('test websocket "close" message', () => {
    jest.isolateModules(() => {
      require('../src/client');

      // get websocket instance
      const createdWebSocket = jest.mocked(WebSocket).mock.results[0]
        .value as WebSocket;

      // initialization is already tested by previous test
      const messageObj = { type: 'close' };
      createdWebSocket.onmessage!(
        new MessageEvent('test', { data: JSON.stringify(messageObj) }),
      );
    });
  });
});
