import _object_spread from "@swc/helpers/src/_object_spread.mjs";
import p from "path";
if (Math.random() === 1.2) {
    console.log(_object_spread({}, require("foo")), p);
} else {
    require("bar");
}
