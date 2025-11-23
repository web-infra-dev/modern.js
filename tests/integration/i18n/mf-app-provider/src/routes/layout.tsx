import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import { Outlet } from '@modern-js/runtime/router';
import useIsRemote from '../hooks/useIsRemote';

export default function Layout() {
  const { changeLanguage } = useModernI18n();
  const isRemote = useIsRemote();
  console.log('isRemote', isRemote);
  return (
    <div>
      {!isRemote ? (
        <div>
          <button id="zh-button" onClick={() => changeLanguage('zh')}>
            zh
          </button>
          <button id="en-button" onClick={() => changeLanguage('en')}>
            en
          </button>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
