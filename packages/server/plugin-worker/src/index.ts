import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  fs,
  getPackageManager,
  isWorker,
  ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import {
  LOCK_FILE,
  MANIFEST_FILE,
  PKG_FILE,
  WORKER_SERVER,
  WORKER_SERVER_ENTRY,
  WRANGLER_FILE,
} from './constants';
import { worker } from './code';
import { copyfile } from './utils';

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-worker',
  setup: ctx => {
    return {
      async beforeDeploy() {
        const { appDirectory, distDirectory } = ctx.useAppContext();

        const configContext = ctx.useResolvedConfigContext();

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
            importStr += `import { serverRender as ${route.entryName}ServerRender } from "../${route.bundle}";\n`;
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
  routes: ${JSON.stringify(routeArr, null, '   ')}
}
        `;
        fs.writeFileSync(path.join(workServerDir, MANIFEST_FILE), manifest);
        // package.json
        const pkg = fs.readJSONSync(path.join(appDirectory, PKG_FILE));
        await fs.writeJSON(
          path.join(distDirectory, PKG_FILE),
          {
            // 使用 lerna + yarn 时，如果包没有 name 和 version，依赖不会安装
            name: pkg.name,
            version: pkg.version,
            dependencies: {
              '@modern-js/prod-server': '0.0.0-next-20230206081248', // TODO
              wrangler: '^2.9.0',
            },
            resolutions: pkg.resolutions || {},
            pnpm: pkg.pnpm || {},
          },
          { spaces: 2 },
        );
        // copy lockfile
        const manager = await getPackageManager(appDirectory);
        const lockfile = LOCK_FILE[manager];
        copyfile(distDirectory, appDirectory, [lockfile]);
        // wrangler.toml
        fs.writeFileSync(
          path.join(distDirectory, WRANGLER_FILE),
          `name = "${pkg.name}"
main = "${path.join(WORKER_SERVER, WORKER_SERVER_ENTRY)}"
compatibility_date = "${new Date()}"
        `,
        );
      },
    };
  },
});
