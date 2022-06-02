import path from 'path';
import { fs } from '@modern-js/utils';
import { Handler, SchemaHandler } from '@modern-js/bff-runtime';
import 'reflect-metadata';
import { HttpMethod, OperatorType, TriggerType } from '../types';
import { APIMode, FRAMEWORK_MODE_LAMBDA_DIR, API_FILE_RULES } from './constant';
import { getFiles, getPathFromFilename, requireHandlerModule } from './utils';

export type ModuleInfo = {
  filename: string;
  module: HandlerModule;
};

export type ApiHandler = Handler<any, any> | SchemaHandler<any, any>;

export type HandlerModule = Record<string, ApiHandler>;

export type APIHandlerInfo = {
  handler: ApiHandler;
  httpMethod: string;
  routePath: string;
};

export class ApiRouter {
  private apiDir: string;

  private lambdaDir: string;

  constructor({ apiDir }: { apiDir: string }) {
    this.apiDir = apiDir;
    this.lambdaDir = this.getLambdaDir(this.apiDir);
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
      apiHandlers = apiHandlers.concat(handlerInfos);
    });

    return apiHandlers;
  }

  private getModuleHandlerInfos(moduleInfo: ModuleInfo) {
    const { module, filename } = moduleInfo;
    return Object.entries(module)
      .filter(([, handler]) => typeof handler === 'function')
      .map(([key]) => {
        const handler = module[key];
        const handlerInfo = this.getHandlerInfo(filename, key, handler);
        return handlerInfo;
      });
  }

  getHandlerInfo(
    filename: string,
    originFuncName: string,
    handler: ApiHandler,
  ) {
    const httpMethod = this.getHttpMethod(originFuncName, handler);
    if (!httpMethod) {
      throw new Error(`Unknown HTTP Method: ${originFuncName}`);
    }
    const routePath = this.getRoutePath(this.lambdaDir, filename, handler);
    return {
      handler,
      httpMethod,
      routePath,
    };
  }

  getRoutePath(
    lambdaDir: string,
    filename: string,
    handler: ApiHandler,
  ): string {
    const trigger = Reflect.getMetadata(OperatorType.Trigger, handler);
    if (trigger && trigger.type === TriggerType.Http) {
      if (!trigger.path) {
        throw new Error(
          `The http trigger ${trigger.name} needs to specify a path`,
        );
      }
      return trigger.path;
    }
    const routePath = getPathFromFilename(lambdaDir, filename);
    return routePath;
  }

  getHttpMethod(originHandlerName: string, handler?: ApiHandler): string {
    if (handler) {
      const trigger = Reflect.getMetadata(OperatorType.Trigger, handler);
      if (trigger) {
        return trigger.method as string;
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
        return upperName;
    }
  }

  getApiFiles() {
    return getFiles(this.lambdaDir, API_FILE_RULES);
  }

  getApiHandlers() {
    const filenames = this.getApiFiles();
    const moduleInfos = this.getModuleInfos(filenames);
    return this.getHandlerInfos(moduleInfos);
  }
}
