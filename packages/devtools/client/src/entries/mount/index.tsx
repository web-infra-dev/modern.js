import './react-devtools-backend';
import './state';
import { createRoot } from 'react-dom/client';
import styles from './index.module.scss';
import { App } from './App';

const setup = () => {
  const outer = document.createElement('div');
  outer.className = '_modern_js_devtools_container';
  document.body.appendChild(outer);

  const shadow = outer.attachShadow({ mode: 'closed' });

  const template = document.getElementById('_modern_js_devtools_styles');
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error('template not found');
  }
  shadow.appendChild(template.content);

  const container = document.createElement('div');
  container.classList.add(
    '_modern_js_devtools_mountpoint',
    'theme-register',
    styles.container,
  );
  shadow.appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setup);
} else {
  setup();
}
