import { createBridgeComponent } from '@module-federation/modern-js-v3/react-v19';
import App from './App';

export const provider = createBridgeComponent({
  rootComponent: App,
});

export default provider;
