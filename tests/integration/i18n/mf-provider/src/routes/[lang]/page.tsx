import { useLoaderData } from '@modern-js/runtime/router';
import type { ProfileData } from './page.data';

export default () => {
  const profileData = useLoaderData() as ProfileData;
  const data = profileData.data;
  if (typeof data !== 'string') {
    return <div>Loading...</div>;
  }
  return <div id="key">{data}</div>;
};
