export interface ModernRouteInterface {
  // modern js web entry name
  entryName: string;
  // the url path for request match
  urlPath: string;
  // the default resource file to response to route
  entryPath?: string;
  // if route is spa page
  isSPA?: boolean;
  // if route is ssr page
  isSSR?: boolean;
  // if route is api service
  isApi?: boolean;
  // ssr js bundle for ssr page
  bundle?: string;
  // if route has modern product
  enableModernMode?: boolean;
  // specialHeader?: SpecialHeader[];
}

export class ModernRoute implements ModernRouteInterface {
  public entryName: string;

  public urlPath: string;

  public entryPath: string;

  public bundle: string;

  public isApi: boolean;

  public isSSR: boolean;

  public isSPA: boolean;

  public enableModernMode?: boolean;

  constructor(routeSpec: ModernRouteInterface) {
    this.entryName = routeSpec.entryName;
    this.urlPath = routeSpec.urlPath;
    this.entryPath = routeSpec.entryPath || '';
    this.isSSR = routeSpec.isSSR || false;
    this.isSPA = routeSpec.isSPA || false;
    this.isApi = routeSpec.isApi || false;
    this.bundle = routeSpec.bundle || '';
    this.enableModernMode = routeSpec.enableModernMode ?? false;
  }
}
