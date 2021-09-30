// globby needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.clearImmediate = clearTimeout;
