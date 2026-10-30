import { redirect } from '@modern-js/runtime/router';

export const loader = () => redirect('/detail/42?tab=initial#summary');
