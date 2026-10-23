import { withViewProps } from '../src/server/index';

const direct = withViewProps({ structuredContent: { message: 'Hello' } });
const message: string = direct.viewProps.message;
const mapped = withViewProps(
  { structuredContent: { orders: [{ id: '1' }], total: 1 } },
  data => ({ items: data.orders, totalCount: data.total }),
);
const count: number = mapped.viewProps.totalCount;
const id: string = mapped.viewProps.items[0].id;
// @ts-expect-error Mapped props do not expose unmapped business fields.
mapped.viewProps.total;
// @ts-expect-error Scalar business data must be wrapped in an object.
withViewProps({ structuredContent: 1 });
// @ts-expect-error Arrays must be wrapped in an object.
withViewProps({ structuredContent: [1] });
// @ts-expect-error Mapping must return a props object.
withViewProps({ structuredContent: {} }, () => 'text');
void [message, count, id];
