import _sliced_to_array from "@swc/helpers/src/_sliced_to_array.mjs";
var _this = this;
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
import { useState } from "react";
var App = function() {
    var _useState = _sliced_to_array(useState(0), 2), count = _useState[0], setCount = _useState[1];
    return /*#__PURE__*/ _jsxDEV("div", {
        children: [
            "Hello World. ",
            count,
            " ",
            /*#__PURE__*/ _jsxDEV("button", {
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
export default App;
