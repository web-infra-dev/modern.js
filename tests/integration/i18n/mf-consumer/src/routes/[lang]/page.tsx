import { createLazyComponent } from '@module-federation/modern-js/react';
import { getInstance } from '@module-federation/modern-js/runtime';
import { useTranslation } from 'react-i18next';

const RemoteSSRComponent = createLazyComponent({
  instance: getInstance(),
  loader: () => import('componentRemote/Text'),
  loading: 'loading...',
  export: 'default',
  fallback: ({ error }) => {
    if (error instanceof Error && error.message.includes('not exist')) {
      return <div>fallback - not existed id</div>;
    }
    return <div>fallback</div>;
  },
});

export default () => {
  const { t } = useTranslation();
  return (
    <div id="key">
      {t('key')}
      <RemoteSSRComponent />
    </div>
  );
};
