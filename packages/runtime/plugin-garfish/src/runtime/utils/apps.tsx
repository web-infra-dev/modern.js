import { RuntimeReactContext } from '@meta/runtime';
import Garfish, { type interfaces } from 'garfish';
// The loading logic of the current component refers to react-loadable https://github.com/jamiebuilds/react-loadable
import type React from 'react';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { generateSubAppContainerKey, logger } from '../../util';
import { Loadable, type MicroProps } from '../loadable';
// import Loadable from 'react-loadable';
import type {
  Manifest,
  MicroComponentProps,
  ModulesInfo,
} from '../useModuleApps';

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

function deepEqualExcludeFunctions(prev: any, next: any): boolean {
  if (prev === next) return true;
  if (!prev || !next) return false;
  if (typeof prev !== 'object' || typeof next !== 'object') return false;

  const prevKeys = Object.keys(prev).filter(
    key => typeof prev[key] !== 'function',
  );
  const nextKeys = Object.keys(next).filter(
    key => typeof next[key] !== 'function',
  );

  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) return false;

    const prevVal = prev[key];
    const nextVal = next[key];

    if (typeof prevVal === 'function' || typeof nextVal === 'function') {
      continue;
    }

    if (typeof prevVal === 'object' && typeof nextVal === 'object') {
      if (!deepEqualExcludeFunctions(prevVal, nextVal)) {
        return false;
      }
    } else if (prevVal !== nextVal) {
      return false;
    }
  }

  return true;
}

function getAppInstance(
  options: typeof Garfish.options,
  appInfo: ModulesInfo[number],
  manifest?: Manifest,
) {
  // Create a callback registry center
  // This object is within the closure of getAppInstance and will only be created once for the same sub-app.
  // It will be shared by all MicroApp component instances to store the state setter of the currently active component
  const componentSetterRegistry = {
    current: null as React.Dispatch<
      React.SetStateAction<{
        component: React.ComponentType<any> | null;
        isFromJupiter?: boolean;
      }>
    > | null,
  };

  function MicroApp(props: MicroProps) {
    const appRef = useRef<interfaces.App | null>(null);
    const locationHrefRef = useRef('');
    const propsRef = useRef<MicroProps>(props);
    const previousPropsRef = useRef<MicroProps>(props);
    const propsUpdateCounterRef = useRef(0);

    const domId = generateSubAppContainerKey(appInfo);
    const [
      { component: SubModuleComponent, isFromJupiter },
      setSubModuleComponent,
    ] = useState<{
      component: React.ComponentType<any> | null;
      isFromJupiter?: boolean;
    }>({
      component: null,
      isFromJupiter: false,
    });
    const [propsUpdateKey, setPropsUpdateKey] = useState(0);
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

    const locationPathname = useMemo(
      function () {
        return location ? location.pathname : '';
      },
      [location ? location.pathname : ''],
    );

    // useLocation is NECESSARY in syncPopStateEvent
    useEffect(() => {
      if (
        location &&
        locationHrefRef.current !== location.pathname &&
        !Garfish.running
      ) {
        locationHrefRef.current = location.pathname;
        const popStateEvent = new PopStateEvent('popstate');
        (popStateEvent as any).garfish = true;
        dispatchEvent(popStateEvent);
        logger(`MicroApp Garfish.loadApp popstate`);
      }
    }, [locationPathname]);

    useEffect(() => {
      const prevPropsForCompare = { ...previousPropsRef.current };
      const currentPropsForCompare = { ...props };

      Object.keys(prevPropsForCompare).forEach(key => {
        if (typeof prevPropsForCompare[key] === 'function') {
          delete prevPropsForCompare[key];
        }
      });
      Object.keys(currentPropsForCompare).forEach(key => {
        if (typeof currentPropsForCompare[key] === 'function') {
          delete currentPropsForCompare[key];
        }
      });

      if (
        !deepEqualExcludeFunctions(prevPropsForCompare, currentPropsForCompare)
      ) {
        previousPropsRef.current = props;
        propsRef.current = props;
        propsUpdateCounterRef.current += 1;
        setPropsUpdateKey(prev => prev + 1);
      }
    }, [props, appInfo.name]);

    useEffect(() => {
      // [MODIFIED] Register the current instance's state setter when the component mounts
      componentSetterRegistry.current = setSubModuleComponent;

      const { setLoadingState, ...userProps } = propsRef.current;

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
          const SubComponent = SubModuleComponent || jupiter_submodule_app_key;
          const isFromJupiter =
            !SubModuleComponent && !!jupiter_submodule_app_key;
          const componetRenderMode = manifest?.componentRender;
          return {
            mount: (...props) => {
              if (componetRenderMode && SubComponent) {
                // [MODIFIED] Get and call the current state setter from the registry center
                // This way, even if the mount method is cached, it can still call the setter of the latest component instance
                if (componentSetterRegistry.current) {
                  componentSetterRegistry.current({
                    component: SubComponent,
                    isFromJupiter,
                  });
                } else {
                  logger(
                    `[Garfish] MicroApp for "${appInfo.name}" tried to mount, but no active component setter was found.`,
                  );
                }
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
        // [MODIFIED] Unregister the state setter when the component unmounts to prevent memory leaks and calls to unmounted components
        componentSetterRegistry.current = null;

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
    }, [basename, domId, appInfo.name]);

    useEffect(() => {
      if (appRef.current?.appInfo) {
        const { setLoadingState, ...updatedProps } = props;
        const updatedPropsWithKey = {
          ...appInfo.props,
          ...updatedProps,
          _garfishPropsUpdateKey: propsUpdateKey,
        };
        appRef.current.appInfo.props = updatedPropsWithKey;
      }
    }, [propsUpdateKey, props]);

    // Remove setLoadingState from props
    const { setLoadingState, ...renderProps } = props;

    // Create the final props that include _garfishPropsUpdateKey
    const finalRenderProps = {
      ...renderProps,
      _garfishPropsUpdateKey: propsUpdateKey,
    };

    // Use propsUpdateKey as part of the key
    // If the component is from jupiter_submodule_app_key, don't use the update key calculation logic
    const componentKey = isFromJupiter
      ? undefined
      : `${appInfo.name}-${propsUpdateKey}`;

    return (
      <>
        <div id={domId}>
          {SubModuleComponent && (
            <SubModuleComponent
              {...(componentKey ? { key: componentKey } : {})}
              {...finalRenderProps}
            />
          )}
        </div>
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
