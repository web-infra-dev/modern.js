import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLoaderData } from '@modern-js/runtime/router';

export default function IsolationPage() {
  const { t, i18n } = useTranslation();
  const data = useLoaderData() as { source: string; probe: string };
  const [count, setCount] = useState(0);
  return (
    <article data-testid="isolation-producer" data-language={i18n.language}>
      <h2 data-testid="isolation-greeting">{t('greeting')}</h2>
      <p data-testid="isolation-data">
        {data.source}:{data.probe}
      </p>
      <button
        data-testid="isolation-count"
        onClick={() => setCount(value => value + 1)}
      >
        Count: {count}
      </button>
      <button
        data-testid="isolation-language"
        onClick={() => i18n.changeLanguage('zh')}
      >
        Chinese
      </button>
      {(['render', 'intent', 'none'] as const).map(prefetch => (
        <Link
          key={prefetch}
          prefetch={prefetch}
          data-testid={`isolation-${prefetch}`}
          to={`detail/${prefetch}?probe=${data.probe}-${prefetch}`}
        >
          {prefetch}
        </Link>
      ))}
      <Link
        data-testid="isolation-default"
        to={`detail/default?probe=${data.probe}-default`}
      >
        Default
      </Link>
    </article>
  );
}
