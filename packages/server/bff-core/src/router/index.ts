import path from 'path';
import { fs, logger } from '@modern-js/utils';
import 'reflect-metadata';
import { HttpMethod, httpMethods, OperatorType, TriggerType } from '../types';
import { debug } from '../utils';
import {
  APIMode,
  FRAMEWORK_MODE_LAMBDA_DIR,
  API_FILE_RULES,
} from './constants';
import {
  getFiles,
  getPathFromFilename,
  requireHandlerModule,
  sortRoutes,
} from './utils';
import { ModuleInfo, ApiHandler, APIHandlerInfo } from './types';

export * from './types';
export * from './constants';

export class ApiRouter {
  private apiDir: string;

  private lambdaDir: string;

  private prefix: string;

  private apiFiles: string[];

  constructor({
    apiDir,
    lambdaDir,
    prefix,
  }: {
    apiDir: string;
    lambdaDir?: string;
    prefix?: string;
  }) {
    this.apiFiles = [];

    if (apiDir) {
      this.validateAbsolute(apiDir, 'apiDir');
    }

    if (lambdaDir) {
      this.validateAbsolute(lambdaDir, 'lambdaDir');
    }

    this.prefix = this.initPrefix(prefix);
    this.apiDir = apiDir;
    this.lambdaDir = lambdaDir || this.getLambdaDir(this.apiDir);
  }

  public isApiFile(filename: string) {
    if (!this.apiFiles.includes(filename)) {
      return false;
    }
    return true;
  }

  public getSingleModuleHandlers(filename: string) {
    const moduleInfo = this.getModuleInfo(filename);
    if (moduleInfo) {
      return this.getModuleHandlerInfos(moduleInfo);
    }
    return null;
  }

  public getHandlerInfo(
    filename: string,
    originFuncName: string,
    handler: ApiHandler,
  ): APIHandlerInfo | null {
    const httpMethod = this.getHttpMethod(originFuncName, handler);
    const routeName = this.getRouteName(filename, handler);
    if (httpMethod && routeName) {
      return {
        handler,
        name: originFuncName,
        httpMethod,
        routeName,
        filename,
        routePath: this.getRoutePath(this.prefix, routeName),
      };
    }
    return null;
  }

  // TODO: 性能提升，开发环境，判断下 lambda 目录修改时间
  public getSafeRoutePath(filename: string, handler?: ApiHandler): string {
    this.loadApiFiles();
    this.validateValidApifile(filename);
    return this.getRouteName(filename, handler);
  }

  public getRouteName(filename: string, handler?: ApiHandler): string {
    if (handler) {
      const trigger = Reflect.getMetadata(OperatorType.Trigger, handler);
      if (trigger && trigger.type === TriggerType.Http) {
        if (!trigger.path) {
          throw new Error(
            `The http trigger ${trigger.name} needs to specify a path`,
          );
        }
        return trigger.path;
      }
    }

    const routePath = getPathFromFilename(this.lambdaDir, filename);
    return routePath;
  }

  public getHttpMethod(
    originHandlerName: string,
    handler?: ApiHandler,
  ): HttpMethod | null {
    if (handler) {
      const trigger = Reflect.getMetadata(OperatorType.Trigger, handler);
      if (trigger && httpMethods.includes(trigger.method)) {
        return trigger.method;
      }
    }

    const upperName = originHandlerName.toUpperCase();
    switch (upperName) {
      case 'GET':
        return HttpMethod.Get;
      case 'POST':
        return HttpMethod.Post;
      case 'PUT':
        return HttpMethod.Put;
      case 'DELETE':
      case 'DEL':
        return HttpMethod.Delete;
      case 'CONNECT':
        return HttpMethod.Connect;
      case 'TRACE':
        return HttpMethod.Trace;
      case 'PATCH':
        return HttpMethod.Patch;
      case 'OPTION':
        return HttpMethod.Option;
      case 'DEFAULT': {
        return HttpMethod.Get;
      }
      default:
        logger.warn(
          `Only api handlers are allowd to be exported, please remove the function ${originHandlerName} from exports`,
        );
        return null;
    }
  }

  public loadApiFiles() {
    // eslint-disable-next-line no-multi-assign
    const apiFiles = (this.apiFiles = getFiles(this.lambdaDir, API_FILE_RULES));
    return apiFiles;
  }

  public getApiFiles() {
    if (this.apiFiles.length > 0) {
      return this.apiFiles;
    }
    return this.loadApiFiles();
  }

  public getApiHandlers() {
    const filenames = this.getApiFiles();
    const moduleInfos = this.getModuleInfos(filenames);
    const apiHandlers = this.getHandlerInfos(moduleInfos);
    debug('apiHandlers', apiHandlers.length, apiHandlers);
    return apiHandlers;
  }

  /**
   * 如果用户未传入或传入空串，默认为 /api
   * 如果传入 /，则 prefix 为 /
   */
  private initPrefix(prefix?: string) {
    if (prefix === '/') {
      return '';
    }
    return prefix || '/api';
  }

  private validateAbsolute(filename: string, paramsName: string) {
    if (!path.isAbsolute(filename)) {
      throw new Error(`The ${paramsName} ${filename} is not a abolute path`);
    }
  }

  private getAPIMode = (apiDir: string): APIMode => {
    const exist = this.createExistChecker(apiDir);

    if (exist(FRAMEWORK_MODE_LAMBDA_DIR)) {
      return APIMode.FARMEWORK;
    }

    return APIMode.FUNCTION;
  };

  private createExistChecker = (base: string) => (target: string) =>
    fs.pathExistsSync(path.resolve(base, target));

  private getLambdaDir = (apiDir: string): string => {
    if (this.lambdaDir) {
      return this.lambdaDir;
    }
    const mode = this.getAPIMode(apiDir);

    const lambdaDir =
      mode === APIMode.FARMEWORK
        ? path.join(apiDir, FRAMEWORK_MODE_LAMBDA_DIR)
        : apiDir;

    return lambdaDir;
  };

  private getModuleInfos(filenames: string[]): ModuleInfo[] {
    return filenames
      .map(filename => this.getModuleInfo(filename))
      .filter(moduleInfo => Boolean(moduleInfo)) as ModuleInfo[];
  }

  private getModuleInfo(filename: string) {
    try {
      const module = requireHandlerModule(filename);
      return {
        filename,
        module,
      };
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      } else {
        console.error(err);
        return null;
      }
    }
  }

  private getHandlerInfos(moduleInfos: ModuleInfo[]) {
    let apiHandlers: APIHandlerInfo[] = [];

    moduleInfos.forEach(moduleInfo => {
      const handlerInfos = this.getModuleHandlerInfos(moduleInfo);
      if (handlerInfos) {
        apiHandlers = apiHandlers.concat(handlerInfos);
      }
    });
    const sortedHandlers = sortRoutes(apiHandlers);
    return sortedHandlers;
  }

  private getModuleHandlerInfos(moduleInfo: ModuleInfo): APIHandlerInfo[] {
    const { module, filename } = moduleInfo;
    return Object.entries(module)
      .filter(([, handler]) => typeof handler === 'function')
      .map(([key]) => {
        const handler = module[key];
        const handlerInfo = this.getHandlerInfo(filename, key, handler);
        return handlerInfo;
      })
      .filter(handlerInfo => Boolean(handlerInfo)) as APIHandlerInfo[];
  }

  private validateValidApifile(filename: string) {
    if (!this.apiFiles.includes(filename)) {
      throw new Error(`The ${filename} is not a valid api file.`);
    }
  }

  private getRoutePath(prefix: string, routeName: string) {
    const finalRouteName = routeName === '/' ? '' : routeName;
    if (prefix === '' && finalRouteName === '') {
      return '/';
    }
    return `${prefix}${finalRouteName}`;
  }
}
