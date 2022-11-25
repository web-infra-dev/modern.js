import { jsx as _jsx } from "react/jsx-runtime";
import KebabCase from "foo/__/kebab-case";
import Button from "foo/__/button";
export function f() {
    console.log(Button);
    console.log(KebabCase);
}
export var Jsx = function() {
    return /*#__PURE__*/ _jsx(KebabCase, {
        children: /*#__PURE__*/ _jsx(Button, {
            children: "button"
        })
    });
};
