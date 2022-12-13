import _sliced_to_array from "@swc/helpers/src/_sliced_to_array.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
export var App = function() {
    var _useState = _sliced_to_array(useState(0), 2), count = _useState[0], setCount = _useState[1];
    return /*#__PURE__*/ _jsxs("div", {
        children: [
            "Hello World. ",
            count,
            " ",
            /*#__PURE__*/ _jsx("button", {
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
