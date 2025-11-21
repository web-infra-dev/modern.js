import { useLoaderData } from '@modern-js/runtime/router';
import i18next from '../i18n';
import type { ProfileData } from './page.data';
/**
 * Note: In SSR scenarios, the data loader may not reflect language updates in time.
 * This is because the execution order of data loaders and onBeforeRender differs between SSR and CSR:
 * - In SSR: data loaders execute before onBeforeRender completes language detection/initialization
 * - In CSR: onBeforeRender runs first, ensuring language is set before data loaders execute
 */
export default () => {
  const profileData = useLoaderData() as ProfileData;
  const data = profileData.data;
  console.log('===data', data);
  if (typeof data !== 'string') {
    return (
      <>
        <div>Loading...</div>
        <div id="key">{i18next.t('key')}</div>
      </>
    );
  }
  return <div id="key">{data}</div>;
};
