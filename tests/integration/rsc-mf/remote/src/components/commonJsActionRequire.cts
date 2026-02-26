const remoteActions = require('./actions') as typeof import('./actions');

export const runCommonJsRemoteActionEcho = async () =>
  remoteActions.remoteActionEcho('commonjs-action-require');
