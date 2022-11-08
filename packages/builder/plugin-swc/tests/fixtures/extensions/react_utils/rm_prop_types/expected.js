import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
export default function() {
    useEffect(function() {
        console.log("hello");
    }, []);
    return /*#__PURE__*/ _jsx("div", {
        children: "Hello World"
    });
};
