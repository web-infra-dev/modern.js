import React, { useEffect, useMemo, useState } from 'react';
import garfish from 'garfish';
import type { Config, ModulesInfo, Options, ModuleInfo } from '../typings';
import { generateSubAppContainerKey } from './constant';
import useLoadApp from './useLoadApp';
import useLocationChangeEffect from './useLocationChangeEffect';
import { useIsMatchedCurrentApp } from './route';
import { customLoader } from './customLoader';

class Apps {
  public modules: ModulesInfo = [];

  public options: Options;

  public pid: string = '';

  public config: Config;

  private runing: boolean = false;

  private readonly LoadingComponent: any = null;

  private setMAppLoading?: React.Dispatch<any>;

  private mappModuleInfo?: ModuleInfo;

  private readonly appsMap: Record<string, React.ComponentType<any>> = {};

  private readonly subAppUpdaterMap: Record<string, (...args: any) => any> = {};

  constructor(config: Config) {
    const { manifest, ...options } = config;

    this.config = config;

    if (config.LoadingComponent) {
      this.LoadingComponent = config.LoadingComponent;
    }

    this.options = options as Options;
  }

  private readonly renderLoading = (loading: boolean) => {
    if (!loading) {
      return null;
    }

    if (typeof this.LoadingComponent === 'function') {
      return <this.LoadingComponent />;
    }

    return this.LoadingComponent;
  };

  private readonly setSubAppUpdater = (
    name: string,
    updater: (...args: any) => any,
  ) => {
    this.subAppUpdaterMap[name] = updater;
  };

  private genComponent(_moduleInfo?: ModuleInfo) {
    const usingGarfishRouter = !_moduleInfo;
    const getModuleInfo = () => _moduleInfo || this.mappModuleInfo;

    const domId = generateSubAppContainerKey(getModuleInfo());
    const { renderLoading, options } = this;

    const bindLoading = (loadingFn: any) => (this.setMAppLoading = loadingFn);
    const { setSubAppUpdater } = this;

    const Component = (props: any) => {
      const [ModuleApp, setModuleApp] =
        useState<React.ComponentType<any> | null>(null);
      const moduleInfo = getModuleInfo();
      const loadApp = useLoadApp({
        usingGarfishRouter,
        basename: options.basename as string,
        domId,
      });

      const [loading, setLoading] = useState(false);

      useMemo(() => {
        bindLoading(setLoading);
        if (moduleInfo) {
          setSubAppUpdater(moduleInfo.name, setModuleApp);
        }
      }, [moduleInfo]);

      if (moduleInfo) {
        moduleInfo.props = {
          ...moduleInfo.props,
          ...props,
        };
      }

      useLocationChangeEffect(usingGarfishRouter);

      useEffect(() => {
        if (!moduleInfo) {
          return () => undefined;
        }

        moduleInfo.props = {
          ...moduleInfo.props,
          ...props,
        };

        let unMountFn: any;

        async function load() {
          setLoading(true);

          if (typeof unMountFn === 'function') {
            await unMountFn();
          }

          try {
            const res = await loadApp(moduleInfo!);

            await res.mount();
            // eslint-disable-next-line require-atomic-updates
            unMountFn = res.unmount;
          } finally {
            setLoading(false);
          }
        }
        load();

        return () => {
          if (typeof unMountFn === 'function') {
            unMountFn();
          }
        };
      }, [moduleInfo?.name || moduleInfo?.entry || '']);

      const isMatched = useIsMatchedCurrentApp(moduleInfo!, usingGarfishRouter);

      return (
        <>
          <div id={domId}></div>
          {renderLoading(loading)}
          {loading || !isMatched
            ? null
            : ModuleApp && <ModuleApp {...moduleInfo!.props} />}
        </>
      );
    };

    return Component;
  }

  public getMApp() {
    return this.genComponent(null as any);
  }

  getApps() {
    return this.appsMap;
  }

  private init() {
    this.modules =
      (window as any)?.modern_manifest?.modules ||
      (typeof this.config.manifest.modules === 'string'
        ? []
        : this.config.manifest.modules);

    this.modules.forEach(moduleInfo => {
      moduleInfo.active = (_moduleInfo: ModuleInfo) => {
        this.mappModuleInfo = _moduleInfo;
        if (this.setMAppLoading) {
          this.setMAppLoading(true);
        }
      };

      this.appsMap[moduleInfo.name] = this.genComponent(moduleInfo);
    });

    this.options = {
      ...this.options,
      customLoader: customLoader(this.subAppUpdaterMap) as any,
      domGetter: `#${generateSubAppContainerKey()}`,
      apps: this.modules,
    };
  }

  public run() {
    if (this.runing) {
      return;
    }

    this.init();
    garfish.run(this.options);

    this.runing = true;
  }
}

export default Apps;
