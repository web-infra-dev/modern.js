import { redirect } from '@modern-js/runtime/router';
import { $state } from './state';

export const loader = async () => {
  const service = await $state.service;
  return redirect(service.rules ? './editor' : './welcome');
};
