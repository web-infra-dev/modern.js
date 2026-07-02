import type { SharedMessage } from '@shared/index';
import { shared } from '@shared/index';

export const message: SharedMessage = shared;

export const getMessage: () => Promise<import('@shared/index').SharedMessage> =
  async () => message;
