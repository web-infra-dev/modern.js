import { createModernReactRemote } from '@modern-js/runtime/mf';
import { useParams } from '@modern-js/runtime/router';
import { loadRemote } from '@module-federation/enhanced/runtime';

const PanelA = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/MemoryRouteApp'),
  memoryRoute: {
    initialEntries: [
      '/',
      {
        pathname: '/detail/11',
        search: '?tab=specs&probe=panel-a',
        state: { from: 'catalog' },
      },
      '/detail/22?tab=reviews&probe=panel-a-unused',
    ],
    initialIndex: 1,
    basename: '/shop',
  },
});

const PanelB = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/MemoryRouteApp'),
  memoryRoute: {
    initialEntries: ['/', '/redirect?target=42&tab=landed&probe=panel-b'],
    initialIndex: 1,
    basename: '/promo',
  },
});

const PanelCSR = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/MemoryRouteApp'),
  noSSR: true,
  memoryRoute: {
    initialEntries: [
      '/',
      {
        pathname: '/detail/77',
        search: '?tab=csr&probe=panel-csr',
        state: { from: 'csr-card' },
      },
    ],
    initialIndex: 1,
    basename: '/embed',
  },
});

export default function MemoryRouteSectionPage() {
  const { section } = useParams();
  return (
    <div data-testid="memory-host-section" data-section={section}>
      <h1 data-testid="memory-host-heading">Section: {section}</h1>
      <section data-testid="memory-panel-a">
        <PanelA label="panel-a" />
      </section>
      <section data-testid="memory-panel-b">
        <PanelB label="panel-b" />
      </section>
      <section data-testid="memory-panel-csr">
        <PanelCSR label="panel-csr" />
      </section>
    </div>
  );
}
