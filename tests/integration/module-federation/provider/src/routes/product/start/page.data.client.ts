import { redirect } from '@modern-js/runtime/router';

export const loader = () => {
  window.dispatchEvent(new Event('mf-lab-initial-client-loader'));
  return redirect('/detail/42?tab=initial#summary');
};
