exports.id = 249;
exports.ids = [249];
exports.modules = {

/***/ 249:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
/*
 ** © 2020 by Philipp Dunkel, Ben Noordhuis, Elan Shankar, Paul Miller
 ** Licensed under MIT License.
 */

/* jshint node:true */


if (process.platform !== "darwin") {
  throw new Error(`Module 'fsevents' is not compatible with platform '${process.platform}'`);
}

const Native = __webpack_require__(653);
const events = Native.constants;

function watch(path, since, handler) {
  if (typeof path !== "string") {
    throw new TypeError(`fsevents argument 1 must be a string and not a ${typeof path}`);
  }
  if ("function" === typeof since && "undefined" === typeof handler) {
    handler = since;
    since = Native.flags.SinceNow;
  }
  if (typeof since !== "number") {
    throw new TypeError(`fsevents argument 2 must be a number and not a ${typeof since}`);
  }
  if (typeof handler !== "function") {
    throw new TypeError(`fsevents argument 3 must be a function and not a ${typeof handler}`);
  }

  let instance = Native.start(Native.global, path, since, handler);
  if (!instance) throw new Error(`could not watch: ${path}`);
  return () => {
    const result = instance ? Promise.resolve(instance).then(Native.stop) : Promise.resolve(undefined);
    instance = undefined;
    return result;
  };
}

function getInfo(path, flags) {
  return {
    path,
    flags,
    event: getEventType(flags),
    type: getFileType(flags),
    changes: getFileChanges(flags),
  };
}

function getFileType(flags) {
  if (events.ItemIsFile & flags) return "file";
  if (events.ItemIsDir & flags) return "directory";
  if (events.ItemIsSymlink & flags) return "symlink";
}
function anyIsTrue(obj) {
  for (let key in obj) {
    if (obj[key]) return true;
  }
  return false;
}
function getEventType(flags) {
  if (events.ItemRemoved & flags) return "deleted";
  if (events.ItemRenamed & flags) return "moved";
  if (events.ItemCreated & flags) return "created";
  if (events.ItemModified & flags) return "modified";
  if (events.RootChanged & flags) return "root-changed";
  if (events.ItemCloned & flags) return "cloned";
  if (anyIsTrue(flags)) return "modified";
  return "unknown";
}
function getFileChanges(flags) {
  return {
    inode: !!(events.ItemInodeMetaMod & flags),
    finder: !!(events.ItemFinderInfoMod & flags),
    access: !!(events.ItemChangeOwner & flags),
    xattrs: !!(events.ItemXattrMod & flags),
  };
}

exports.watch = watch;
exports.getInfo = getInfo;
exports.constants = events;


/***/ }),

/***/ 653:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = require(__webpack_require__.ab + "fsevents.node")

/***/ })

};
;