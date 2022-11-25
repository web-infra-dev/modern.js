import _sliced_to_array from "@swc/helpers/src/_sliced_to_array.mjs";
var _this = this;
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
var _s = $RefreshSig$();
import React, { useState } from "react";
export var App = function() {
    _s();
    var ref = _sliced_to_array(useState(0), 2), count = ref[0], setCount = ref[1];
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
