var _async_to_generator = require("<SWC_HELPER>/_/_async_to_generator");
var _object_spread = require("<SWC_HELPER>/_/_object_spread");
var _ts_generator = require("<SWC_HELPER>/_/_ts_generator");
function asyncFn() {
    return _asyncFn.apply(this, arguments);
}
function _asyncFn() {
    _asyncFn = _async_to_generator._(function() {
        var obj;
        return _ts_generator._(this, function(_state) {
            obj = _object_spread._({}, {
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
