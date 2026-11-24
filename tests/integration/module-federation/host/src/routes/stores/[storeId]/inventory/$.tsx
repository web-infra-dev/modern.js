import { useOutletContext } from '@modern-js/runtime/router';
import { createModernReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
const Product = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/ProductApp'),
});
export default function Inventory() {
  const { label, mounted } = useOutletContext<{
    label: string;
    mounted: boolean;
  }>();
  return mounted ? <Product label={label} /> : null;
}
