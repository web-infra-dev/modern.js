// The loading logic of the current component refers to react-loadable https://github.com/jamiebuilds/react-loadable
import React, { useContext, useState, useEffect, useRef } from 'react';
import { RuntimeReactContext } from '@meta/runtime';
import Garfish, { interfaces } from 'garfish';
// import Loadable from 'react-loadable';
import { Manifest, MicroComponentProps, ModulesInfo } from '../useModuleApps';
import { logger, generateSubAppContainerKey } from '../../util';
import { Loadable, MicroProps } from '../loadable';

export interface Provider extends interfaces.Provider {
  SubModuleComponent?: React.ComponentType<any>;
  jupiter_submodule_app_key?: React.ComponentType<any>;
}
export interface AppMap {
  [key: string]: React.FC<MicroComponentProps>;
}

export function pathJoin(...args: string[]) {
  const res = args.reduce((res, path: string) => {
    let nPath = path;
    if (!nPath || typeof nPath !== 'string') {
      return res;
    }
    if (nPath[0] !== '/') {
      nPath = `/${nPath}`;
    }
    const lastIndex = nPath.length - 1;
    if (nPath[lastIndex] === '/') {
      nPath = nPath.substring(0, lastIndex);
    }
    return res + nPath;
  }, '');
  return res || '/';
}

function getAppInstance(
  options: typeof Garfish.options,
  appInfo: ModulesInfo[number],
  manifest?: Manifest,
) {
  let locationHref = '';
  function MicroApp(props: MicroProps) {
    const appRef = useRef<interfaces.App | null>(null);
    const domId = generateSubAppContainerKey(appInfo);
    const [SubModuleComponent, setSubModuleComponent] = useState<
      React.ComponentType<any> | undefined
    >();
    const context = useContext(RuntimeReactContext);
    const useRouteMatch = props.useRouteMatch ?? context?.router?.useRouteMatch;
    const useMatches = props.useMatches ?? context?.router?.useMatches;
    const useLocation = props.useLocation ?? context?.router?.useLocation;
    const useHistory = props.useHistory ?? context?.router?.useHistory;
    const useHref = props.useHistory ?? context?.router?.useHref;

    const match = useRouteMatch?.();
    const matchs = useMatches?.();

    if (!useLocation) {
      console.warn(
        `[@modern-js/plugin-garfish] Detected that the 'router: false' mode is used. In this case, the basename and popStateEvent cannot be correctly passed to the sub-app.
You can manually pass 'useLocation' and 'useHref' props to assist plugin-garfish in calculating the "basename" and sync popStateEvent:
if you are using react-router-V6:
<Component useLocation={useLocation} useHref={useHref} />

else react-router-V5:
<Component useLocation={useLocation} useHistory={useHistory} />

or directly pass the "basename":
<Component basename={basename} useLocation={useLocation} />`,
      );
    }

    const location = useLocation();

    /**
     * main-app basename:  /main-basename
     * sub-app basename: /main-basename/sub-active-path
     */

    // 1. handle the main-app basename
    /**
     * `options?.basename` comes from
     *  masterApp: {
     *    basename: '/main-app-basename'
     *  },
     */
    let basename = options?.basename || '/';
    if (useHistory /* react-router@5 */) {
      // there is no dynamic switching of the router version in the project
      // so hooks can be used in conditional judgment
      const history = useHistory?.();
      // To be compatible to history@4.10.1 and @5.3.0 we cannot write like this `history.createHref(pathname)`
      basename = history?.createHref?.({ pathname: '/' });
    } else if (useHref /* react-router@6 */) {
      basename = useHref?.('/');
    }

    // 2. handle the subActivePath and `pathJoin(mainBasename, subActivePath)`
    if (matchs && matchs.length > 0 /* react-router@6 */) {
      const matchItem = {
        ...matchs[matchs.length - 1],
      };
      for (const key in matchItem.params) {
        matchItem.pathname = matchItem.pathname.replace(
          new RegExp(`/${matchItem.params[key]}$`),
          '',
        );
      }
      basename = pathJoin(basename, matchItem.pathname || '/');
    } else if (match /* react-router@5 */) {
      basename = pathJoin(basename, match?.path || '/');
    }

    // 3. props.basename has the highest priority
    // e.g: <Component basename={basename} useLocation={useLocation} />
    if (props.basename && typeof props.basename === 'string') {
      basename = props.basename;
    }

    // useLocation is NECESSARY in syncPopStateEvent
    useEffect(() => {
      if (location && locationHref !== location.pathname && !Garfish.running) {
        locationHref = location.pathname;
        const popStateEvent = new PopStateEvent('popstate');
        (popStateEvent as any).garfish = true;
        dispatchEvent(popStateEvent);
        logger(`MicroApp Garfish.loadApp popstate`);
      }
    }, [location]);

    useEffect(() => {
      const { setLoadingState, ...userProps } = props;

      const loadAppOptions: Omit<interfaces.AppInfo, 'name'> = {
        cache: true,
        insulationVariable: [
          ...(appInfo.insulationVariable || []),
          '_SERVER_DATA',
        ],
        domGetter: `#${domId}`,
        ...appInfo,
        basename,
        props: {
          ...appInfo.props,
          ...userProps,
        },
        customLoader: (provider: Provider) => {
          const {
            render,
            destroy,
            SubModuleComponent,
            jupiter_submodule_app_key,
          } = provider;
          const componetRenderMode =
            manifest?.componentRender &&
            (SubModuleComponent || jupiter_submodule_app_key);
          return {
            mount: (...props) => {
              if (componetRenderMode) {
                setSubModuleComponent(SubModuleComponent);
                return undefined;
              } else {
                logger('MicroApp customer render', props);
                return render?.apply(provider, props);
              }
            },
            unmount(...props) {
              if (componetRenderMode) {
                return undefined;
              }
              logger('MicroApp customer destroy', props);
              return destroy?.apply(provider, props);
            },
          };
        },
      };

      setLoadingState({
        isLoading: true,
        error: null,
      });

      logger(`MicroApp Garfish.loadApp "${appInfo.name}"`, {
        loadAppOptions,
      });

      async function renderApp() {
        try {
          const appInstance = await Garfish.loadApp(
            appInfo.name,
            loadAppOptions,
          );
          if (!appInstance) {
            throw new Error(
              `MicroApp Garfish.loadApp "${appInfo.name}" result is null`,
            );
          }

          appRef.current = appInstance;

          setLoadingState({
            isLoading: false,
          });

          if (appInstance.mounted && appInstance.appInfo.cache) {
            logger(`MicroApp Garfish.loadApp "${appInfo.name}" show`, {
              appInfo: appInstance.appInfo,
              appInstance,
            });
            await appInstance?.show();
          } else {
            logger(`MicroApp Garfish.loadApp "${appInfo.name}" mount`, {
              appInfo: appInstance.appInfo,
              appInstance,
            });
            await appInstance?.mount();
          }
        } catch (error) {
          setLoadingState({
            isLoading: true,
            error,
          });
        }
      }
      renderApp();
      return () => {
        if (appRef.current) {
          const { appInfo } = appRef.current;
          if (appInfo.cache) {
            logger(`MicroApp Garfish.loadApp "${appInfo.name}" hide`);
            appRef.current?.hide();
          } else {
            logger(`MicroApp Garfish.loadApp "${appInfo.name}" unmount`);
            appRef.current?.unmount();
          }
        }
      };
    }, []);

    return (
      <>
        <div id={domId}>{SubModuleComponent && <SubModuleComponent />}</div>
      </>
    );
  }

  return Loadable(MicroApp)(manifest?.loadable);
}

export function generateApps(
  options: typeof Garfish.options,
  manifest?: Manifest,
): {
  apps: AppMap;
  appInfoList: ModulesInfo;
} {
  const apps: AppMap = {};
  options.apps?.forEach(appInfo => {
    const Component = getAppInstance(options, appInfo, manifest);
    (appInfo as any).Component = Component;
    apps[appInfo.name] = Component as any;
  });

  return { apps, appInfoList: options.apps || [] };
}
