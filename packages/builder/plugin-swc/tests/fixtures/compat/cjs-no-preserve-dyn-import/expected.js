"use strict";
var _interopRequireWildcard = require("<SWC_HELPER>/lib/_interop_require_wildcard.js").default;
require("<CORE_JS>/modules/es.promise.js");
require("<CORE_JS>/modules/es.object.to-string.js");
var a = require("foo");
console.log(a);
Promise.resolve().then(function() {
    return _interopRequireWildcard(require("other"));
}) /*#__PURE__*/ ;
