import { useEffect } from 'react';
import { useHistory } from '@modern-js/plugin-router';

let locationHref = '';

type History = typeof window.history;

(function (history: History) {
  const { pushState } = history;
  history.pushState = function (...args: any[]) {
    if (typeof (history as any).onpushstate === 'function') {
      (history as any).onpushstate({ state: args[0] });
    }

    locationHref = location.href;

    return pushState.apply(history, args as any);
  };
})(window.history);

/**
 * 当主应用路由改变的时候，触发popState 事件，触发子应用路由更新
 * 当启用 garfish 路由的时候，不做更新
 */
const useLocationChangeEffect = (isGarfishRouterOn = false) => {
  const history = useHistory();

  useEffect(() => {
    if (isGarfishRouterOn) {
      return () => {
        // 不做处理
      };
    }

    return history.listen(() => {
      if (locationHref !== location.href) {
        locationHref = location.href;
        const popStateEvent = new PopStateEvent('popstate');
        dispatchEvent(popStateEvent);
      }
    });
  }, [history]);
};

export default useLocationChangeEffect;
