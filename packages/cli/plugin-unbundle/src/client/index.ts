// css HMR
const styles = new Map();

export const removeStyle = id => {
  if (styles.has(id)) {
    document.head.removeChild(styles.get(id));
    styles.delete(id);
  }
};

export const updateStyle = (id, code) => {
  const style = styles.get(id);
  if (!style) {
    const styleEl = document.createElement('style');
    const codeEl = document.createTextNode(code);
    styleEl.type = 'text/css';
    styleEl.appendChild(codeEl);
    document.head.appendChild(styleEl);
    styles.set(id, styleEl);
  } else {
    style.innerHTML = code;
  }
};

const ERROR_OVERLAY_NAME = 'modern-js-error-overlay';

// check if has  error overlay
function hasErrorOverlay() {
  return document.querySelectorAll(ERROR_OVERLAY_NAME).length;
}
// clear react error overlay
function clearErrorOverlay() {
  document.querySelectorAll(ERROR_OVERLAY_NAME).forEach(el => el.remove());
}

// create react error overlay
function createErrorOverlay(data) {
  const ErrorOverlay = customElements.get(ERROR_OVERLAY_NAME);
  if (ErrorOverlay) {
    const overlay = new ErrorOverlay(data);
    clearErrorOverlay();
    document.body.appendChild(overlay);
  }
}

type LoggerFunction = (...args: any[]) => void;
type LoggerType = {
  info: LoggerFunction;
  error: LoggerFunction;
  warn: LoggerFunction;
};
const logger = [`info`, 'error', 'warn'].reduce((m, c) => {
  m[c] = (...params) =>
    // eslint-disable-next-line no-console
    console[c === 'info' ? 'log' : c](`[HMR]:`, ...params);
  return m;
}, {} as LoggerType);

let isFirstUpdate = true;

const handleMessage = event => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'connected': {
      logger.info(`Connected`);
      // TODO: socket ping
      break;
    }
    case 'reload': {
      window.location.reload();
      break;
    }
    case 'update': {
      // if there is already a error in first update
      // which meanings some resource load failed
      // so should reload page to ensure app run correctly
      if (isFirstUpdate && hasErrorOverlay()) {
        window.location.reload();
        return;
      }

      isFirstUpdate = false;

      try {
        const timestamp = data.hmrTimestamp;
        for (const { id, accepted } of data.changes) {
          doAccept(id, accepted, timestamp);
        }
        clearErrorOverlay();
      } catch (err) {
        logger.error('Hot Update Error', err);
        createErrorOverlay({
          title: 'Hot Update Error',
          loc: {
            file: data.url || '',
          },
          message: err.message,
          stack: err.stack,
        });
      }

      break;
    }
    // handle removed dependencies after hmr update
    // eg: remove style tags in head element
    case 'prune': {
      for (const id of data.changes) {
        doPrune(id);
      }
      break;
    }
    case 'error': {
      logger.error(data.message);
      createErrorOverlay(data);
      break;
    }
    case 'close': {
      logger.info(`Disconnected!`);
      break;
    }
    default: {
      logger.error(`Invalid message type:`, data);
    }
  }
};

const handleError = err => {
  logger.error(`connection error`, err);
};

let retries = 0;
const handleClose = () => {
  logger.info(`Disconnected!`);
  if (retries <= 10) {
    retries += 1;
    setTimeout(() => {
      initSocket();
    }, 1000 * Math.pow(2, retries) + Math.random() * 100);
  }
};

// init websocket client connection
const initSocket = () => {
  const ws = new WebSocket(
    `${location.origin.replace(/http/, 'ws')}/_modern_js_hmr_ws`,
  );
  ws.onerror = handleError;
  ws.onmessage = handleMessage;
  ws.onclose = handleClose;
};

initSocket();

const strip = url => url.replace(/(\?.*$|#.*$)/, '');

const noop = function () {
  /** */
};

const modules = new Map();

let updateQueue = [];
let updating = false;

const doAccept = async (id, acceptedPath, timestamp) => {
  if (!updateQueue.includes(id)) {
    updateQueue.push({ id, acceptedPath });
  }

  if (!updating) {
    updating = true;
    await Promise.resolve();
    updating = false;
    const loading = updateQueue.map(({ id: path, acceptedPath: accepted }) =>
      update(path, accepted, timestamp),
    );
    updateQueue = [];
    await Promise.all(loading);
  }
};

const update = async (id, acceptedPath, timestamp) => {
  if (!modules.has(id)) {
    return;
  }

  const mod = modules.get(id);
  let callbacks = [];
  const modulesToUpdate = new Set();
  if (mod._selfAccepted) {
    modulesToUpdate.add(id);
    callbacks = [mod._selfAccepted];
  } else {
    modulesToUpdate.add(id);
    mod._acceptedCallbacks.forEach(({ deps, callback }) => {
      if (deps.some(dep => dep === acceptedPath)) {
        modulesToUpdate.add(acceptedPath);
        callbacks.push(callback);
      }
    });
  }

  const loadedModules = await Promise.all(
    Array.from(modulesToUpdate).map(m => {
      const newUrl = __addQuery__(m, `t=${timestamp}`);
      return import(newUrl);
    }),
  );

  for (const callback of callbacks) {
    typeof callback === 'function' && callback(loadedModules);
  }

  logger.info(`hot updated: accepted via ${id}`);
};

/** Called when a new module is loaded, to run cleanup on the old module (if needed) */
const doDispose = id => {
  const mod = modules.get(id);
  const callbacks = mod._disposeCallbacks;

  callbacks.map(callback => callback());
};

const doPrune = id => {
  if (modules.has(id)) {
    const mod = modules.get(id);
    const callbacks = mod._prunCallbacks;
    callbacks.map(callback => callback());
    modules.delete(id);
  }
};

export const createHotContext = url => {
  const id = strip(url);
  const mod = modules.get(id);

  if (mod) {
    // mod.lock();
    doDispose(mod._id);
    mod._disposeCallbacks = [];
    mod._acceptedCallbacks = [];
    mod._selfAccepted = false;
    return mod;
  }

  const hot = {
    // private
    _id: id,
    _declinedDeps: {},
    _acceptedDeps: {},
    _selfAccepted: false,
    _selfDeclined: false,
    _disposeCallbacks: [],
    _acceptedCallbacks: [],
    _prunCallbacks: [],
    // hot API
    accept(dep, callback) {
      if (dep === undefined) {
        hot._selfAccepted = true;
      } else if (typeof dep === 'function') {
        hot._selfAccepted = dep;
      } else if (Array.isArray(dep)) {
        hot._acceptedCallbacks.push({ deps: dep, callback: callback || noop });
      } else {
        hot._acceptedCallbacks.push({
          deps: [dep],
          callback: callback || noop,
        });
      }
    },
    decline(dep) {
      if (dep === undefined) {
        hot._selfDeclined = true;
      } else if (Array.isArray(dep)) {
        for (const d of dep) {
          hot._acceptedDeps[d] = true;
        }
      } else {
        hot._declinedDeps[dep] = true;
      }
    },
    dispose(callback) {
      hot._disposeCallbacks.push(callback);
    },
    prune(callback) {
      hot._prunCallbacks.push(callback);
    },
    invalidate() {
      window.location.reload();
    },
  };

  modules.set(id, hot);

  return hot;
};

export const __addQuery__ = (url, query) =>
  /\?.*/.test(url) ? `${url}&${query}` : `${url}?${query}`;
