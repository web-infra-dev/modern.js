"use strict";
var _interopRequireWildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
require("core-js/modules/es.promise.js");
require("core-js/modules/es.object.to-string.js");
var a = require("foo");
console.log(a);
Promise.resolve().then(function() {
    return _interopRequireWildcard(require("other"));
}) /*#__PURE__*/ ;
