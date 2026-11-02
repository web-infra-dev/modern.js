import { useOutletContext } from '@modern-js/runtime/router';
import { createModernReactRemote } from '@modern-js/runtime/mf';
const Product = createModernReactRemote<{ label: string }>({
  remote: 'provider/ProductApp',
});
export default function Inventory() {
  const { label, mounted } = useOutletContext<{
    label: string;
    mounted: boolean;
  }>();
  return mounted ? <Product label={label} /> : null;
}
