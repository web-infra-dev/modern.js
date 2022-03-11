import { ServerRoute as ModernRouteInterface } from '@modern-js/types';

export type { ModernRouteInterface };

export class ModernRoute implements ModernRouteInterface {
  public entryName: string;

  public urlPath: string;

  public entryPath: string;

  public bundle: string;

  public isApi: boolean;

  public isSSR: boolean;

  public isSPA: boolean;

  public enableModernMode?: boolean;

  public params: Record<string, any> = {};

  constructor(routeSpec: ModernRouteInterface) {
    this.entryName = routeSpec.entryName || '';
    this.urlPath = routeSpec.urlPath;
    this.entryPath = routeSpec.entryPath || '';
    this.isSSR = routeSpec.isSSR || false;
    this.isSPA = routeSpec.isSPA || false;
    this.isApi = routeSpec.isApi || false;
    this.bundle = routeSpec.bundle || '';
    this.enableModernMode = routeSpec.enableModernMode ?? false;
  }
}
