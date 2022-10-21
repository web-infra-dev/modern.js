"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
var _interopRequireDefault = require("@swc/helpers/lib/_interop_require_default.js").default;
var _objectSpread = require("@swc/helpers/lib/_object_spread.js").default;
var _path = /*#__PURE__*/ _interopRequireDefault(require("path"));
if (Math.random() === 1.2) {
    console.log(_objectSpread({}, require("foo")), _path.default);
} else {
    require("bar");
}
