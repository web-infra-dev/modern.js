function config(entry = []) {
  return [
    ...entry,
    require.resolve('../dist/js/node/runtime-addon/preset/preview'),
  ];
}

function managerEntries(entry = []) {
  return [...entry];
}

module.exports = {
  managerEntries,
  config,
};
