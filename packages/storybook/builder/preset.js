// This file is for some package that can't use exports field,
// for example, framework needs to specify builder path using
// abs path, when resolve abs path, exports is ignored
module.exports = require('./dist/cjs/preset.js');
