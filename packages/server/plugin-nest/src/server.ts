import type { ServerPlugin } from '@modern-js/server-core';
import { isFunction, logger } from '@modern-js/utils';
import { NestFactory } from '@nestjs/core';
import {
  Catch,
  INestApplication,
  Module,
  NotFoundException,
  ExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common';
import bodyParser from 'body-parser';
import finalhandler from 'finalhandler';
import { APIHandlerInfo } from '@modern-js/bff-core';
import {
  getCustomApp,
  NEST_APP_ENTRY_NAME,
  getMiddleware,
  initMiddlewares,
  API_DIR,
} from './helpers';

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-nest',
  pre: ['@modern-js/plugin-bff'],
  setup: api => ({
    prepareApiServer: async ({ config, pwd, mode, prefix }) => {
      let app: INestApplication;
      const middlewareInputs = initMiddlewares(config?.middleware || []);
      const modules = middlewareInputs.filter(isModule);
      const middlewares = middlewareInputs.filter(
        middleware => !isModule(middleware),
      );

      const appContext = api.useAppContext();
      const handlerInfos = appContext.apiHandlerInfos as APIHandlerInfo[];

      if (mode === 'framework') {
        const custom = await getCustomApp(pwd);
        if (!custom) {
          throw new Error(
            `Expect a nest app entry at '/${API_DIR}/${NEST_APP_ENTRY_NAME}.ts'.`,
          );
        }
        if (isFunction(custom)) {
          app = await custom(modules);
        } else {
          app = custom;
        }
      } else {
        @Module({ imports: modules })
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        class AppModule {}
        app = await NestFactory.create(AppModule);
      }

      if (prefix) {
        app.setGlobalPrefix(prefix);
      }

      middlewares.forEach(middleware => {
        app.use(middleware);
      });

      const server = app.getHttpAdapter().getInstance();

      // parse text/plain
      server.use(bodyParser.text());

      // parse application/x-www-form-urlencoded
      server.use(bodyParser.urlencoded({ extended: false }));

      // parse application/json
      server.use(bodyParser.json());

      handlerInfos.forEach(handler => {
        const { routeName, httpMethod } = handler;
        const setter = httpMethod.toLowerCase();
        server[setter](routeName, getMiddleware(handler));
      });

      await app.init();

      return server;
    },
    prepareWebServer: async ({ config }) => {
      const middlewareInputs = initMiddlewares(config?.middleware || []);
      const modules = middlewareInputs.filter(isModule);
      const middlewares = middlewareInputs.filter(
        middleware => !isModule(middleware),
      );
      @Catch(NotFoundException)
      class NotFoundExceptionFilter implements ExceptionFilter {
        catch(exception: NotFoundException, host: ArgumentsHost) {
          const ctx = host.switchToHttp();
          const request = ctx.getRequest<Request>();
          const response = ctx.getResponse<Response>();
          const status = exception.getStatus();

          // if not found any match, invoke resolve bind before
          const next = (request as any).modern_promise;
          if (typeof next === 'function') {
            next();
            return;
          }

          (response as any).status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
          });
        }
      }

      @Module({ imports: modules })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class AppModule {}
      const app = await NestFactory.create(AppModule);
      app.useGlobalFilters(new NotFoundExceptionFilter());
      middlewares.forEach(middleware => {
        app.use(middleware);
      });

      await app.init();

      return (req, res) =>
        new Promise((resolve, reject) => {
          const handler = () => {
            if (res.headersSent && res.statusCode !== 200) {
              finalhandler(req, res, {
                onerror: logger.error.bind(logger),
              })(null);
            }
            resolve();
          };

          // when user call res.send
          res.on('finish', (err: Error) => {
            if (err) {
              return reject(err);
            }
            return resolve();
          });

          // bind resolve to req
          (req as any).modern_promise = resolve;
          return app.getHttpAdapter().getInstance()(req, res, handler);
        });
    },
  }),
});

const isModule = (v: Record<string, unknown>) =>
  Reflect.hasMetadata('providers', v) ||
  Reflect.hasMetadata('controllers', v) ||
  Reflect.hasMetadata('imports', v) ||
  Reflect.hasMetadata('exports', v);
