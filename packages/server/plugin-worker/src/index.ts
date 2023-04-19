import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  fs,
  isServiceWorker,
  PLUGIN_SCHEMAS,
  ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import {
  MANIFEST_FILE,
  PKG_FILE,
  WORKER_SERVER,
  WORKER_SERVER_ENTRY,
  WRANGLER_FILE,
} from './constants';
import { worker } from './code';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-worker',
  setup: ctx => {
    return {
      async config() {
        return {
          output: {
            disableNodePolyfill: false,
          },
          // TODO
          // tools: {
          //   webpackChain: (chain, { isServiceWorker }) => {
          //     if (isServiceWorker) {
          //       chain.resolve.alias.set(
          //         'async_hooks',
          //         path.resolve(__dirname, './async_hooks'),
          //       );
          //     }
          //   },
          // },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-worker'];
      },
      async afterDev() {
        const { appDirectory, distDirectory } = ctx.useAppContext();

        const configContext = ctx.useResolvedConfigContext();

        if (!isServiceWorker(configContext)) {
          return;
        }
        writeWorkerServerFile(appDirectory, distDirectory);
      },
      async afterBuild() {
        const { appDirectory, distDirectory } = ctx.useAppContext();

        const configContext = ctx.useResolvedConfigContext();

        if (!isServiceWorker(configContext)) {
          return;
        }
        writeWorkerServerFile(appDirectory, distDirectory);
      },
    };
  },
});

const writeWorkerServerFile = (appDirectory: string, distDirectory: string) => {
  const workServerDir = path.join(distDirectory, WORKER_SERVER);
  fs.removeSync(workServerDir);
  fs.mkdirSync(workServerDir);
  // entry file
  fs.writeFileSync(path.join(workServerDir, WORKER_SERVER_ENTRY), worker());
  // manifest file
  const routeJSON = path.join(distDirectory, ROUTE_SPEC_FILE);
  const { routes } = fs.readJSONSync(routeJSON);
  let importStr = ``;
  let pageStr = ``;
  const routeArr: {
    entryName: string;
    isSSR: boolean;
    urlPath: string;
  }[] = [];
  routes.forEach(
    (route: {
      urlPath: string;
      entryName: string;
      entryPath: string;
      worker: string;
      isSSR: boolean;
      isApi: boolean;
    }) => {
      if (route.isSSR) {
        importStr += `import { serverRender as ${route.entryName}ServerRender } from "../${route.worker}";\n`;
      }
      if (!route.isApi) {
        importStr += `import ${route.entryName}template from "../${route.entryPath}";\n`;
        pageStr += `"${route.urlPath}": {
        entryName: "${route.entryName}",
        template: ${route.entryName}template,
        serverRender: ${
          route.isSSR ? `${route.entryName}ServerRender` : undefined
        },
      },`;
        routeArr.push({
          entryName: route.entryName,
          isSSR: route.isSSR,
          urlPath: route.urlPath,
        });
      }
    },
  );

  const manifest = `
${importStr}

export const manifest = {
  pages: {
    ${pageStr}
  },
  routes: ${JSON.stringify(routeArr, null, '   ')}
}
        `;
  fs.writeFileSync(path.join(workServerDir, MANIFEST_FILE), manifest);
  const pkg = fs.readJSONSync(path.join(appDirectory, PKG_FILE));
  // wrangler.toml
  fs.writeFileSync(
    path.join(distDirectory, WRANGLER_FILE),
    `name = "${pkg.name}"
main = "${path.join(WORKER_SERVER, WORKER_SERVER_ENTRY)}"
compatibility_date = "${new Date().toISOString().substring(0, 10)}"
        `,
  );
};
