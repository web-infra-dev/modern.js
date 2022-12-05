"use strict";
var _asyncToGenerator = require("@swc/helpers/lib/_async_to_generator.js").default;
var _objectSpread = require("@swc/helpers/lib/_object_spread.js").default;
var _tsGenerator = require("@swc/helpers/lib/_ts_generator.js").default;
function asyncFn() {
    return _asyncFn.apply(this, arguments);
}
function _asyncFn() {
    _asyncFn = _asyncToGenerator(function() {
        var obj;
        return _tsGenerator(this, function(_state) {
            obj = _objectSpread({}, {
                o: 1
            });
            return [
                2,
                Math.pow(1, 2)
            ];
        });
    });
    return _asyncFn.apply(this, arguments);
}
