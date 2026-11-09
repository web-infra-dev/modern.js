import { redirect } from '@modern-js/runtime/router';

export const loader = () => {
  const shouldRedirect = true;
  const attempt = new CustomEvent('mf-lab-initial-client-loader', {
    cancelable: true,
    detail: { redirect: shouldRedirect },
  });
  // A regression test can stop a repeated attempt without allowing a request
  // storm. It still fails its exactly-once assertion when this guard is used.
  if (!window.dispatchEvent(attempt)) return new Promise<never>(() => {});
  if (!shouldRedirect) return null;
  return redirect('/detail/42?tab=initial#summary');
};
