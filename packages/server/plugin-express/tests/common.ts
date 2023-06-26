// globby needs setImmediate
// @ts-expect-error
global.setImmediate = setTimeout;

// @ts-expect-error
global.clearImmediate = clearTimeout;
