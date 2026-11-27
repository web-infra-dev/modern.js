import { useEffect } from 'react';
import { defineRuntimeConfig, type RuntimePlugin } from '@modern-js/runtime';
import { reportRecovery } from './failure/events';
const recoveryObserver = (): RuntimePlugin => ({
  name: 'lab-ssr-recovery',
  setup(api) {
    api.wrapRoot(
      App =>
        function LabRoot(props) {
          useEffect(() => {
            // A comparison iframe may navigate before passive effects flush.
            const element = document.documentElement;
            if (element) element.dataset.labReady = 'true';
          }, []);
          return <App {...props} />;
        },
    );
    api.onBeforeRender(() => {
      if (typeof document === 'undefined') return;
      // React marks an errored streaming Suspense boundary with $! followed
      // by a template (including in production, where error messages are hidden).
      for (const template of Array.from(
        document.querySelectorAll('[data-lab-remote] template'),
      )) {
        if (
          template.previousSibling?.nodeType !== 8 ||
          template.previousSibling.textContent !== '$!'
        )
          continue;
        const remote = template
          .closest('[data-lab-remote]')!
          .getAttribute('data-lab-remote')!;
        reportRecovery('Client fallback', remote, 'Modern onBeforeRender');
      }
    });
  },
});
export default defineRuntimeConfig({ plugins: [recoveryObserver()] });
