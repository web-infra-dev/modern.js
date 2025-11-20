import { useLoaderData } from '@modern-js/runtime/router';
import { createLazyComponent } from '@module-federation/modern-js/react';
import { getInstance } from '@module-federation/modern-js/runtime';
import type { ProfileData } from './page.data';

const RemoteSSRComponent = createLazyComponent({
  instance: getInstance(),
  loader: () => import('remote/Image'),
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
  const profileData = useLoaderData() as ProfileData;
  const data = profileData.data;
  if (typeof data !== 'string') {
    return <div>Loading...</div>;
  }
  return (
    <div id="key">
      {data}
      <RemoteSSRComponent />
    </div>
  );
};
