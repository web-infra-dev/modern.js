import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { render } from '@modern-js/runtime/browser';
import { createBridgeComponent } from '@modern-js/runtime/mf';
const ModernRoot = createRoot({ route: '/product' });
let failed = false;
export default createBridgeComponent({
  rootComponent: ModernRoot,
  render: (component, dom) => {
    if (!failed) {
      failed = true;
      throw new Error('Weather route mount failed once');
    }
    return render(component, dom);
  },
});
