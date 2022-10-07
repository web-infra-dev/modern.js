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
var _jsxRuntime = require("react/jsx-runtime");
var _react = /*#__PURE__*/ _interopRequireWildcard(require("react"));
var App = function() {
    var ref = _slicedToArray((0, _react.useState)(0), 2), count = ref[0], setCount = ref[1];
    return /*#__PURE__*/ (0, _jsxRuntime.jsxs)("div", {
        children: [
            "Hello World. ",
            count,
            " ",
            /*#__PURE__*/ (0, _jsxRuntime.jsx)("button", {
                onClick: function() {
                    return setCount(function(c) {
                        return c + 1;
                    });
                },
                children: "Count++"
            }),
            " "
        ]
    });
};
