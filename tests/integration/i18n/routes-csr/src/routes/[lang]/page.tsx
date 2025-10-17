import { useLoaderData } from '@modern-js/runtime/router';
import type { ProfileData } from './page.data';

export default () => {
  const profileData = useLoaderData() as ProfileData;
  return <div id="key">{profileData.data}</div>;
};
