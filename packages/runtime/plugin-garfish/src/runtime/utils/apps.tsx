// The loading logic of the current component refers to react-loadable https://github.com/jamiebuilds/react-loadable
import React, {useContext, useState, useEffect, useRef} from 'react';
// import { withRouter, useMatches } from '@modern-js/runtime/router';
import { RuntimeReactContext } from '@modern-js/runtime';
// eslint-disable-next-line import/no-named-as-default
import Garfish, { interfaces } from 'garfish';
// import Loadable from 'react-loadable';
import { Manifest, MicroComponentProps, ModulesInfo } from '../useModuleApps';
import { logger, generateSubAppContainerKey } from '../../util';
import { Loadable } from '../loadable';

export interface Provider extends interfaces.Provider {
  SubModuleComponent?: React.ComponentType<any>;
  jupiter_submodule_app_key?: React.ComponentType<any>;
}
export interface AppMap {
  [key: string]: React.FC<MicroComponentProps>;
}

export function pathJoin(...args: string[]){
  let res = args.reduce((res,path: string)=>{
      if (!path || typeof path !== 'string') return res;
      if (path[0]!=='/') path = '/'+path;
      const lastIndex = path.length-1;
      if(path[lastIndex]==='/') path = path.substring(0, lastIndex);
      return res + path;
  },'');
  return res || '/';
}

function getAppInstance(
  options: typeof Garfish.options,
  appInfo: ModulesInfo[number],
  manifest?: Manifest,
) {
  let locationHref = '';
  function MicroApp(props: any){
    const appRef = useRef<interfaces.App | null>(null);
    const [domId, _] = useState(generateSubAppContainerKey(appInfo));
    const [SubModuleComponent, setSubModuleComponent] = useState<React.ComponentType<any> | undefined>();
    const context = useContext(RuntimeReactContext);
    const match = context?.router?.useRouteMatch?.();
    const matchs = context?.router?.useMatches?.()
    const location = context?.router?.useLocation?.();
    let basename = options?.basename || '/';
    if (matchs && matchs.length > 0) {
      basename = pathJoin(basename, matchs[matchs.length - 1].pathname  || '/');
    } else if(match) {
      basename = pathJoin(basename, match?.path  || '/');
    }

    useEffect(()=>{
      if (location && locationHref !== location.pathname) {
        locationHref = location.pathname;
        const popStateEvent = new PopStateEvent('popstate');
        (popStateEvent as any).garfish = true;
        dispatchEvent(popStateEvent);
        logger(`MicroApp Garfish.loadApp popstate`);
      }
    },[location])

    useEffect(()=>{
      const { setLoadingState, ...userProps } = props;

      const loadAppOptions: Omit<interfaces.AppInfo, 'name'> = {
        ...appInfo,
        insulationVariable: [
          ...(appInfo.insulationVariable || []),
          '_SERVER_DATA',
        ],
        domGetter: `#${domId}`,
        basename: basename,
        cache: true,
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

      async function renderApp(){
        try {
          const appInstance = await Garfish.loadApp(appInfo.name, loadAppOptions);
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
      return ()=>{
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
      }
    },[]);

    return (
      <>
        <div id={domId}>{SubModuleComponent && <SubModuleComponent />}</div>
      </>
    );
  }

  return Loadable(MicroApp)(
    manifest?.loadable,
  );
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
