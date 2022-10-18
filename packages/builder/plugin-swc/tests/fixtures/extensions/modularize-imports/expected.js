"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "f", {
    enumerable: true,
    get: function() {
        return f;
    }
});
var _interopRequireDefault = require("@swc/helpers/lib/_interop_require_default.js").default;
var _foo = /*#__PURE__*/ _interopRequireDefault(require("foo/__/Foo"));
function f() {
    console.log(_foo.default);
}
