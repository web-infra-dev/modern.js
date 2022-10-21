"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "App", {
    enumerable: true,
    get: function() {
        return App;
    }
});
var _interopRequireWildcard = require("@swc/helpers/lib/_interop_require_wildcard.js").default;
var _slicedToArray = require("@swc/helpers/lib/_sliced_to_array.js").default;
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
var _this = void 0;
var _s = $RefreshSig$();
var App = function() {
    _s();
    var ref = _slicedToArray((0, _react.useState)(0), 2), count = ref[0], setCount = ref[1];
    return /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("div", {
        children: [
            "Hello World. ",
            count,
            " ",
            /*#__PURE__*/ (0, _jsxDevRuntime.jsxDEV)("button", {
                onClick: function() {
                    return setCount(function(c) {
                        return c + 1;
                    });
                },
                children: "Count++"
            }, void 0, false, {
                fileName: "/react/fast-refresh/actual.jsx",
                lineNumber: 9,
                columnNumber: 7
            }, _this),
            " "
        ]
    }, void 0, true, {
        fileName: "/react/fast-refresh/actual.jsx",
        lineNumber: 7,
        columnNumber: 5
    }, _this);
};
_s(App, "oDgYfYHkD9Wkv4hrAPCkI/ev3YU=");
_c = App;
var _c;
$RefreshReg$(_c, "App");
