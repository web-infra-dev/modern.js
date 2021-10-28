const { upath } = require('@modern-js/utils');

function config(entry = []) {
  return [
    ...entry,
    upath.normalizeSafe(
      require.resolve('../dist/js/node/runtime-addon/preset/preview'),
    ),
  ];
}

function managerEntries(entry = []) {
  return [...entry];
}

module.exports = {
  managerEntries,
  config,
};
