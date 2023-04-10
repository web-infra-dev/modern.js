"use strict";
var _interop_require_wildcard = require("<SWC_HELPER>/_/_interop_require_wildcard");
require("<CORE_JS>/modules/es.promise.js");
require("<CORE_JS>/modules/es.object.to-string.js");
var a = require("foo");
console.log(a);
Promise.resolve().then(function() {
    return _interop_require_wildcard._(require("other"));
}) /*#__PURE__*/ ;
