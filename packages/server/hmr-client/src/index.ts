/**
 * This has been adapted from `create-react-app`, authored by Facebook, Inc.
 * see: https://github.com/facebookincubator/create-react-app/tree/master/packages/react-dev-utils
 *
 * Tips: this package will be bundled and running in the browser, do not import from the entry of @modern-js/utils.
 */
import stripAnsi from '@modern-js/utils/strip-ansi';
import { formatWebpackMessages } from '@modern-js/utils/format';
import type webpack from 'webpack';
import { createSocketUrl } from './createSocketUrl';

// declare any to fix the type of `module.hot`
declare const module: any;

// We need to keep track of if there has been a runtime error.
// Essentially, we cannot guarantee application state was not corrupted by the
// runtime error. To prevent confusing behavior, we forcibly reload the entire
// application. This is handled below when we are notified of a compile (code
// change).
// See https://github.com/facebook/create-react-app/issues/3096
const hadRuntimeError = false;

// Connect to Dev Server
const socketUrl = createSocketUrl(__resourceQuery);

const connection = new WebSocket(socketUrl);

// Unlike WebpackDevServer client, we won't try to reconnect
// to avoid spamming the console. Disconnect usually happens
// when developer stops the server.
connection.onclose = function () {
  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(
      'The development server has disconnected.\nRefresh the page if necessary.',
    );
  }
};

// Remember some state related to hot module replacement.
let isFirstCompilation = true;
let mostRecentCompilationHash: string | null = null;
let hasCompileErrors = false;

function clearOutdatedErrors() {
  // Clean up outdated compile errors, if any.
  if (typeof console !== 'undefined' && typeof console.clear === 'function') {
    if (hasCompileErrors) {
      console.clear();
    }
  }
}

// Successful compilation.
function handleSuccess() {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}

// Compilation with warnings (e.g. ESLint).
function handleWarnings(warnings: webpack.StatsError[]) {
  clearOutdatedErrors();

  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;

  function printWarnings() {
    // Print warnings to the console.
    const formatted = formatWebpackMessages({
      warnings,
      errors: [],
    });

    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      for (let i = 0; i < formatted.warnings.length; i++) {
        if (i === 5) {
          console.warn(
            'There were more warnings in other files.\n' +
              'You can find a complete log in the terminal.',
          );
          break;
        }
        console.warn(stripAnsi(formatted.warnings[i]));
      }
    }
  }

  printWarnings();

  // Attempt to apply hot updates or reload.
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}

// Compilation with errors (e.g. syntax error or missing modules).
function handleErrors(errors: webpack.StatsError[]) {
  clearOutdatedErrors();

  isFirstCompilation = false;
  hasCompileErrors = true;

  // "Massage" webpack messages.
  const formatted = formatWebpackMessages({
    errors,
    warnings: [],
  });

  // Also log them to the console.
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    for (const error of formatted.errors) {
      console.error(stripAnsi(error));
    }
  }

  // Do not attempt to reload now.
  // We will reload on next success instead.
}

// There is a newer version of the code available.
function handleAvailableHash(hash: string) {
  // Update last known compilation hash.
  mostRecentCompilationHash = hash;
}

// Handle messages from the server.
connection.onmessage = function (e) {
  const message = JSON.parse(e.data);
  switch (message.type) {
    case 'hash':
      handleAvailableHash(message.data);
      break;
    case 'still-ok':
    case 'ok':
      handleSuccess();
      break;
    case 'content-changed':
      // Triggered when a file from `contentBase` changed.
      window.location.reload();
      break;
    case 'warnings':
      handleWarnings(message.data);
      break;
    case 'errors':
      handleErrors(message.data);
      break;
    default:
    // Do nothing.
  }
};

// Is there a newer version of this code available?
function isUpdateAvailable() {
  // __webpack_hash__ is the hash of the current compilation.
  // It's a global variable injected by webpack.
  return mostRecentCompilationHash !== __webpack_hash__;
}

// webpack disallows updates in other states.
function canApplyUpdates() {
  return module.hot.status() === 'idle';
}

// Attempt to update code on the fly, fall back to a hard reload.
function tryApplyUpdates() {
  if (!module.hot) {
    // HotModuleReplacementPlugin is not in webpack configuration.
    window.location.reload();
    return;
  }

  if (!isUpdateAvailable() || !canApplyUpdates()) {
    return;
  }

  function handleApplyUpdates(err: any, updatedModules: any) {
    // NOTE: This var is injected by Webpack's DefinePlugin, and is a boolean instead of string.
    const hasReactRefresh = process.env.FAST_REFRESH;
    const wantsForcedReload = err || !updatedModules || hadRuntimeError;
    // React refresh can handle hot-reloading over errors.
    if (!hasReactRefresh && wantsForcedReload) {
      window.location.reload();
      return;
    }

    if (isUpdateAvailable()) {
      // While we were updating, there was a new update! Do it again.
      tryApplyUpdates();
    }
  }

  // https://webpack.github.io/docs/hot-module-replacement.html#check
  const result = module.hot.check(/* autoApply */ true, handleApplyUpdates);

  // // webpack 2 returns a Promise instead of invoking a callback
  if (result?.then) {
    result.then(
      (updatedModules: any) => {
        handleApplyUpdates(null, updatedModules);
      },
      (err: any) => {
        handleApplyUpdates(err, null);
      },
    );
  }
}
