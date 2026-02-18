import remoteActions = require('./actions');

export const runImportEqualsRemoteActionEcho = async () =>
  remoteActions.remoteActionEcho('import-equals-action-require');
