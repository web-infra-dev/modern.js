"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
var _slicedToArray = require("@swc/helpers/lib/_sliced_to_array.js").default;
var _jsxDevRuntime = require("react/jsx-dev-runtime");
var _react = require("react");
var _this = void 0;
var App = function() {
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
                fileName: "/react/jsx-runtime/actual.jsx",
                lineNumber: 9,
                columnNumber: 7
            }, _this),
            " "
        ]
    }, void 0, true, {
        fileName: "/react/jsx-runtime/actual.jsx",
        lineNumber: 7,
        columnNumber: 5
    }, _this);
};
var _default = App;
