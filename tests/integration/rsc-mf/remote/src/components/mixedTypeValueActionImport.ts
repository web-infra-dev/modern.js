import { type incrementRemoteCount, remoteActionEcho } from './actions';

export const runMixedTypeValueActionImport = async () =>
  remoteActionEcho('mixed-type-value-action-import');

export type IncrementRemoteCountActionFromMixed = typeof incrementRemoteCount;
