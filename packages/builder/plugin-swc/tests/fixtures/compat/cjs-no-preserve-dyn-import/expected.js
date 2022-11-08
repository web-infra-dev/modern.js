"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _interopRequireWildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
<<<<<<< HEAD
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
=======
require("core-js/modules/es.promise.js");
require("core-js/modules/es.object.to-string.js");
>>>>>>> e9b458eb6 (chore: upgrade swc-plugins, update tests)
var a = require("foo");
console.log(a);
Promise.resolve().then(function() {
    return /*#__PURE__*/ _interopRequireWildcard(require("other"));
});
