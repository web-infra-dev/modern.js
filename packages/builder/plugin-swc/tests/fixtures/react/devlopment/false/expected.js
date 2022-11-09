import _sliced_to_array from "@swc/helpers/src/_sliced_to_array.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
export var App = function() {
    var ref = _sliced_to_array(useState(0), 2), count = ref[0], setCount = ref[1];
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
