// FIXME: 临时修复 HMR 代码
// TODO: 修复 HMR 问题后移除
// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */

const path = require('path');
const { fs } = require('@modern-js/utils');

fs.outputFileSync(
  path.join(
    __dirname,
    'dist/js/node/dev-tools/dev-middleware/hmr-client/index.js',
  ),
  `var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_strip_ansi = __toESM(require("@modern-js/utils/strip-ansi"));
var import_format = require("@modern-js/utils/format");
var import_createSocketUrl = require("./createSocketUrl");
const hadRuntimeError = false;
const socketUrl = (0, import_createSocketUrl.createSocketUrl)(__resourceQuery);
const connection = new WebSocket(socketUrl);
connection.onclose = function() {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info(
      "The development server has disconnected. Refresh the page if necessary."
    );
  }
};
let isFirstCompilation = true;
let mostRecentCompilationHash = null;
let hasCompileErrors = false;
function clearOutdatedErrors() {
  if (typeof console !== "undefined" && typeof console.clear === "function") {
    if (hasCompileErrors) {
      console.clear();
    }
  }
}
function handleSuccess() {
  clearOutdatedErrors();
  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}
function handleWarnings(warnings) {
  clearOutdatedErrors();
  const isHotUpdate = !isFirstCompilation;
  isFirstCompilation = false;
  hasCompileErrors = false;
  function printWarnings() {
    const formatted = (0, import_format.formatWebpackMessages)({
      warnings,
      errors: []
    });
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      for (let i = 0; i < formatted.warnings.length; i++) {
        if (i === 5) {
          console.warn(
            "There were more warnings in other files. You can find a complete log in the terminal."
          );
          break;
        }
        console.warn((0, import_strip_ansi.default)(formatted.warnings[i]));
      }
    }
  }
  printWarnings();
  if (isHotUpdate) {
    tryApplyUpdates();
  }
}
function handleErrors(errors) {
  clearOutdatedErrors();
  isFirstCompilation = false;
  hasCompileErrors = true;
  const formatted = (0, import_format.formatWebpackMessages)({
    errors,
    warnings: []
  });
  if (typeof console !== "undefined" && typeof console.error === "function") {
    for (const error of formatted.errors) {
      console.error((0, import_strip_ansi.default)(error));
    }
  }
}
function handleAvailableHash(hash) {
  mostRecentCompilationHash = hash;
}
connection.onmessage = function(e) {
  const message = JSON.parse(e.data);
  switch (message.type) {
    case "hash":
      handleAvailableHash(message.data);
      break;
    case "still-ok":
    case "ok":
      handleSuccess();
      break;
    case "content-changed":
      window.location.reload();
      break;
    case "warnings":
      handleWarnings(message.data);
      break;
    case "errors":
      handleErrors(message.data);
      break;
    default:
  }
};
function isUpdateAvailable() {
  return mostRecentCompilationHash !== __webpack_hash__;
}
function canApplyUpdates() {
  return module.hot.status() === "idle";
}
function tryApplyUpdates() {
  if (!module.hot) {
    window.location.reload();
    return;
  }
  if (!isUpdateAvailable() || !canApplyUpdates()) {
    return;
  }
  function handleApplyUpdates(err, updatedModules) {
    const wantsForcedReload = err || !updatedModules || hadRuntimeError;
    if (wantsForcedReload) {
      window.location.reload();
      return;
    }
    if (isUpdateAvailable()) {
      tryApplyUpdates();
    }
  }
  const result = module.hot.check(true, handleApplyUpdates);
  if (result == null ? void 0 : result.then) {
    result.then(
      (updatedModules) => {
        handleApplyUpdates(null, updatedModules);
      },
      (err) => {
        handleApplyUpdates(err, null);
      }
    );
  }
}
`,
);

fs.outputFileSync(
  path.join(
    __dirname,
    'dist/js/modern/dev-tools/dev-middleware/hmr-client/index.js',
  ),
  `var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
import stripAnsi from "@modern-js/utils/strip-ansi";
import { formatWebpackMessages } from "@modern-js/utils/format";
import { createSocketUrl } from "./createSocketUrl";
var require_hmr_client = __commonJS({
  "src/dev-tools/dev-middleware/hmr-client/index.ts"(exports, module) {
    const hadRuntimeError = false;
    const socketUrl = createSocketUrl(__resourceQuery);
    const connection = new WebSocket(socketUrl);
    connection.onclose = function() {
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info(
          "The development server has disconnected. Refresh the page if necessary."
        );
      }
    };
    let isFirstCompilation = true;
    let mostRecentCompilationHash = null;
    let hasCompileErrors = false;
    function clearOutdatedErrors() {
      if (typeof console !== "undefined" && typeof console.clear === "function") {
        if (hasCompileErrors) {
          console.clear();
        }
      }
    }
    function handleSuccess() {
      clearOutdatedErrors();
      const isHotUpdate = !isFirstCompilation;
      isFirstCompilation = false;
      hasCompileErrors = false;
      if (isHotUpdate) {
        tryApplyUpdates();
      }
    }
    function handleWarnings(warnings) {
      clearOutdatedErrors();
      const isHotUpdate = !isFirstCompilation;
      isFirstCompilation = false;
      hasCompileErrors = false;
      function printWarnings() {
        const formatted = formatWebpackMessages({
          warnings,
          errors: []
        });
        if (typeof console !== "undefined" && typeof console.warn === "function") {
          for (let i = 0; i < formatted.warnings.length; i++) {
            if (i === 5) {
              console.warn(
                "There were more warnings in other files. You can find a complete log in the terminal."
              );
              break;
            }
            console.warn(stripAnsi(formatted.warnings[i]));
          }
        }
      }
      printWarnings();
      if (isHotUpdate) {
        tryApplyUpdates();
      }
    }
    function handleErrors(errors) {
      clearOutdatedErrors();
      isFirstCompilation = false;
      hasCompileErrors = true;
      const formatted = formatWebpackMessages({
        errors,
        warnings: []
      });
      if (typeof console !== "undefined" && typeof console.error === "function") {
        for (const error of formatted.errors) {
          console.error(stripAnsi(error));
        }
      }
    }
    function handleAvailableHash(hash) {
      mostRecentCompilationHash = hash;
    }
    connection.onmessage = function(e) {
      const message = JSON.parse(e.data);
      switch (message.type) {
        case "hash":
          handleAvailableHash(message.data);
          break;
        case "still-ok":
        case "ok":
          handleSuccess();
          break;
        case "content-changed":
          window.location.reload();
          break;
        case "warnings":
          handleWarnings(message.data);
          break;
        case "errors":
          handleErrors(message.data);
          break;
        default:
      }
    };
    function isUpdateAvailable() {
      return mostRecentCompilationHash !== __webpack_hash__;
    }
    function canApplyUpdates() {
      return module.hot.status() === "idle";
    }
    function tryApplyUpdates() {
      if (!module.hot) {
        window.location.reload();
        return;
      }
      if (!isUpdateAvailable() || !canApplyUpdates()) {
        return;
      }
      function handleApplyUpdates(err, updatedModules) {
        const wantsForcedReload = err || !updatedModules || hadRuntimeError;
        if (wantsForcedReload) {
          window.location.reload();
          return;
        }
        if (isUpdateAvailable()) {
          tryApplyUpdates();
        }
      }
      const result = module.hot.check(true, handleApplyUpdates);
      if (result == null ? void 0 : result.then) {
        result.then(
          (updatedModules) => {
            handleApplyUpdates(null, updatedModules);
          },
          (err) => {
            handleApplyUpdates(err, null);
          }
        );
      }
    }
  }
});
export default require_hmr_client();
`,
);

fs.outputFileSync(
  path.join(
    __dirname,
    'dist/js/treeshaking/dev-tools/dev-middleware/hmr-client/index.js',
  ),
  `var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = function(cb, mod) {
      return function __require() {
          return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = {
              exports: {}
          }).exports, mod), mod.exports;
      };
  };
  import stripAnsi from "@modern-js/utils/strip-ansi";
  import { formatWebpackMessages } from "@modern-js/utils/format";
  import { createSocketUrl } from "./createSocketUrl";
  var require_hmr_client = __commonJS({
      "src/dev-tools/dev-middleware/hmr-client/index.ts": function(exports, module) {
          var clearOutdatedErrors = function clearOutdatedErrors() {
              if (typeof console !== "undefined" && typeof console.clear === "function") {
                  if (hasCompileErrors) {
                      console.clear();
                  }
              }
          };
          var handleSuccess = function handleSuccess() {
              clearOutdatedErrors();
              var isHotUpdate = !isFirstCompilation;
              isFirstCompilation = false;
              hasCompileErrors = false;
              if (isHotUpdate) {
                  tryApplyUpdates();
              }
          };
          var handleWarnings = function handleWarnings(warnings) {
              clearOutdatedErrors();
              var isHotUpdate = !isFirstCompilation;
              isFirstCompilation = false;
              hasCompileErrors = false;
              function printWarnings() {
                  var formatted = formatWebpackMessages({
                      warnings: warnings,
                      errors: []
                  });
                  if (typeof console !== "undefined" && typeof console.warn === "function") {
                      for(var i = 0; i < formatted.warnings.length; i++){
                          if (i === 5) {
                              console.warn("There were more warnings in other files. You can find a complete log in the terminal.");
                              break;
                          }
                          console.warn(stripAnsi(formatted.warnings[i]));
                      }
                  }
              }
              printWarnings();
              if (isHotUpdate) {
                  tryApplyUpdates();
              }
          };
          var handleErrors = function handleErrors(errors) {
              clearOutdatedErrors();
              isFirstCompilation = false;
              hasCompileErrors = true;
              var formatted = formatWebpackMessages({
                  errors: errors,
                  warnings: []
              });
              if (typeof console !== "undefined" && typeof console.error === "function") {
                  var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                  try {
                      for(var _iterator = formatted.errors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                          var error = _step.value;
                          console.error(stripAnsi(error));
                      }
                  } catch (err) {
                      _didIteratorError = true;
                      _iteratorError = err;
                  } finally{
                      try {
                          if (!_iteratorNormalCompletion && _iterator.return != null) {
                              _iterator.return();
                          }
                      } finally{
                          if (_didIteratorError) {
                              throw _iteratorError;
                          }
                      }
                  }
              }
          };
          var handleAvailableHash = function handleAvailableHash(hash) {
              mostRecentCompilationHash = hash;
          };
          var isUpdateAvailable = function isUpdateAvailable() {
              return mostRecentCompilationHash !== __webpack_hash__;
          };
          var canApplyUpdates = function canApplyUpdates() {
              return module.hot.status() === "idle";
          };
          var hadRuntimeError = false;
          var socketUrl = createSocketUrl(__resourceQuery);
          var connection = new WebSocket(socketUrl);
          connection.onclose = function() {
              if (typeof console !== "undefined" && typeof console.info === "function") {
                  console.info("The development server has disconnected. Refresh the page if necessary.");
              }
          };
          var isFirstCompilation = true;
          var mostRecentCompilationHash = null;
          var hasCompileErrors = false;
          connection.onmessage = function(e) {
              var message = JSON.parse(e.data);
              switch(message.type){
                  case "hash":
                      handleAvailableHash(message.data);
                      break;
                  case "still-ok":
                  case "ok":
                      handleSuccess();
                      break;
                  case "content-changed":
                      window.location.reload();
                      break;
                  case "warnings":
                      handleWarnings(message.data);
                      break;
                  case "errors":
                      handleErrors(message.data);
                      break;
                  default:
              }
          };
          function tryApplyUpdates() {
              if (!module.hot) {
                  window.location.reload();
                  return;
              }
              if (!isUpdateAvailable() || !canApplyUpdates()) {
                  return;
              }
              function handleApplyUpdates(err, updatedModules) {
                  var wantsForcedReload = err || !updatedModules || hadRuntimeError;
                  if (wantsForcedReload) {
                      window.location.reload();
                      return;
                  }
                  if (isUpdateAvailable()) {
                      tryApplyUpdates();
                  }
              }
              var result = module.hot.check(true, handleApplyUpdates);
              if (result === null || result === void 0 ? void 0 : result.then) {
                  result.then(function(updatedModules) {
                      handleApplyUpdates(null, updatedModules);
                  }, function(err) {
                      handleApplyUpdates(err, null);
                  });
              }
          }
      }
  });
  export default require_hmr_client();
`,
);
