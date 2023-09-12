import { createRoot } from 'react-dom/client';
import DevtoolsAction from './components/Devtools/Action';
import type { MountDevTools } from '@/types';

export const mountDevTools: MountDevTools = (options = {}) => {
  const container = document.createElement('div');
  container.className = '_modern_js_devtools_container';
  container.id = process.env.DEVTOOLS_MARK!;
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: 'closed' });

  const styleTagsField = `__DEVTOOLS_STYLE_${process.env.DEVTOOLS_MARK}`;
  if (styleTagsField in window) {
    // @ts-expect-error
    const styleTags = window[styleTagsField];
    if (!Array.isArray(styleTags)) {
      throw new TypeError(
        `Expect window.${styleTagsField} should be array but got ${typeof styleTags}.`,
      );
    }
    for (const tag of styleTags) {
      if (tag instanceof HTMLElement) {
        shadow.appendChild(tag);
      }
    }
  }

  const app = document.createElement('div');
  app.className = '_modern_js_devtools_mountpoint';
  app.id = process.env.DEVTOOLS_MARK!;
  shadow.appendChild(app);

  const root = createRoot(app);

  root.render(<DevtoolsAction {...options} />);
};
