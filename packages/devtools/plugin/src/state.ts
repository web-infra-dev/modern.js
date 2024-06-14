import { proxy } from 'valtio';
import {
  ServerExportedStateResolvers,
  createServerExportedState,
} from '@modern-js/devtools-kit/node';

export const $serverExportedState = createServerExportedState();

export const $resolvers: ServerExportedStateResolvers =
  $serverExportedState.resolvers;

export const $state = proxy($serverExportedState.state);
