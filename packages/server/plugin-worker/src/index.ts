import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { fs, isWorker, ROUTE_SPEC_FILE } from '@modern-js/utils';
import { MANIFEST_FILE, WORKER_SERVER, WORKER_SERVER_ENTRY } from './constants';
import { worker } from './code';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-worker',
  setup: ctx => {
    return {
      async beforeDeploy() {
        const { appDirectory, distDirectory } = ctx.useAppContext();

        const configContext = ctx.useResolvedConfigContext();

        console.info(appDirectory, distDirectory, configContext);

        if (!isWorker(configContext)) {
          return;
        }
        const workServerDir = path.join(distDirectory, WORKER_SERVER);
        fs.removeSync(workServerDir);
        fs.mkdirSync(workServerDir);
        // entry file
        fs.writeFileSync(
          path.join(workServerDir, WORKER_SERVER_ENTRY),
          worker(),
        );
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
            bundle: string;
            isSSR: boolean;
          }) => {
            importStr += `import { serverRender as ${route.entryName}ServerRender } from "${route.bundle}";\n`;
            pageStr += `"${route.urlPath}": {
              entryName: "${route.entryName}",
              template: "${route.entryPath}",
              serverRender: ${route.entryName}ServerRender,
            },`;
            routeArr.push({
              entryName: route.entryName,
              isSSR: route.isSSR,
              urlPath: route.urlPath,
            });
          },
        );

        const manifest = `
${importStr}

export const manifest = {
  pages: {
    ${pageStr}
  },
  routes: ${JSON.stringify(routeArr, null, '  ')}
}
        `;
        fs.writeFileSync(path.join(workServerDir, MANIFEST_FILE), manifest);
      },
    };
  },
});
