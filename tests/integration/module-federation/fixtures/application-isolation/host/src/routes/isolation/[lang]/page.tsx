import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from '@modern-js/runtime/router';
import { createReactRemote } from '@modern-js/runtime/mf';

const instances = [
  { name: 'one', lang: 'en', noSSR: false },
  { name: 'two', lang: 'fr', noSSR: false },
  { name: 'csr', lang: 'en', noSSR: true },
].map(({ name, lang, noSSR }) => ({
  name,
  Remote: createReactRemote({
    remote: 'provider/IsolationApp',
    memoryRoute: { entryPath: `/${lang}?probe=${name}` },
    noSSR,
  }),
}));

export default function IsolationHost() {
  const { t, i18n } = useTranslation();
  const data = useLoaderData() as { source: string; probe: string };
  useEffect(() => {
    document.documentElement.dataset.isolationReady = 'true';
  }, []);
  return (
    <main data-testid="isolation-host" data-language={i18n.language}>
      <h1 data-testid="isolation-host-greeting">{t('greeting')}</h1>
      <p data-testid="isolation-host-data">
        {data.source}:{data.probe}
      </p>
      {(['render', 'intent', 'none'] as const).map(prefetch => (
        <Link
          key={prefetch}
          prefetch={prefetch}
          data-testid={`isolation-host-${prefetch}`}
          to={`detail/${prefetch}?probe=host-${prefetch}`}
        >
          Host {prefetch}
        </Link>
      ))}
      <Link
        data-testid="isolation-host-default"
        to="detail/default?probe=host-default"
      >
        Host default
      </Link>
      {instances.map(({ name, Remote }) => (
        <section key={name} data-testid={`isolation-${name}`}>
          <Remote />
        </section>
      ))}
    </main>
  );
}
