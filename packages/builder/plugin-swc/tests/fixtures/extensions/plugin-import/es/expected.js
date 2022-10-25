"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    f: function() {
        return f;
    },
    Jsx: function() {
        return Jsx;
    }
});
var _interopRequireDefault = require("@swc/helpers/lib/_interop_require_default.js").default;
var _jsxRuntime = require("react/jsx-runtime");
var _kebabCase = /*#__PURE__*/ _interopRequireDefault(require("foo/__/kebab-case"));
var _button = /*#__PURE__*/ _interopRequireDefault(require("foo/__/button"));
function f() {
    console.log(_button.default);
    console.log(_kebabCase.default);
}
var Jsx = function() {
    return /*#__PURE__*/ (0, _jsxRuntime.jsx)(_kebabCase.default, {
        children: /*#__PURE__*/ (0, _jsxRuntime.jsx)(_button.default, {
            children: "button"
        })
    });
};
