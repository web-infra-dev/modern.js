import { useModernI18n } from '@modern-js/plugin-i18n/runtime';
import { getGlobalBasename } from '@modern-js/runtime/context';
import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  const { changeLanguage } = useModernI18n();
  const basename = getGlobalBasename();
  return (
    <div>
      {!basename ? (
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
