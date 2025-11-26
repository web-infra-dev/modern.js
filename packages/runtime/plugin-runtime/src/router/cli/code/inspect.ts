import path from 'path';
import type {
  AppNormalizedConfig,
  AppTools,
  AppToolsContext,
} from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin';
import type { Entrypoint, NestedRouteForCli } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import { modifyEntrypoints } from '../entry';
import { generateRoutesForEntry } from './index';

export interface RouteInspectInfo {
  path?: string;
  component: string;
  data?: string;
  clientData?: string;
  error?: string;
  loading?: string;
  config?: string;
  params?: string[];
  children?: RouteInspectInfo[];
}

export interface RoutesInspectReport {
  routes: RouteInspectInfo[];
}

export interface MultiEntryRoutesInspectReport {
  [entryName: string]: {
    routes: RouteInspectInfo[];
  };
}

function convertRouteToInspectFormat(
  route: NestedRouteForCli,
): RouteInspectInfo {
  const inspectRoute: RouteInspectInfo = {
    path: route.path ?? undefined,
    component: route._component || '',
  };

  // Extract dynamic route parameters
  if (route.path?.includes(':')) {
    const params =
      route.path.match(/:[^\/]+/g)?.map(param => param.slice(1)) || [];
    inspectRoute.params = params;
  }

  if (route.data) {
    inspectRoute.data = route.data;
  }
  if (route.clientData) {
    inspectRoute.clientData = route.clientData;
  }
  if (route.error) {
    inspectRoute.error = route.error;
  }
  if (route.loading) {
    inspectRoute.loading = route.loading;
  }
  if (route.config) {
    inspectRoute.config =
      typeof route.config === 'string' ? route.config : String(route.config);
  }

  if ('children' in route && route.children && route.children.length > 0) {
    inspectRoute.children = route.children
      .filter(child => {
        const hasComponent = Boolean(child._component);
        const hasChildren =
          'children' in child && child.children && child.children.length > 0;
        const hasPath = child.path !== undefined;

        return hasComponent || hasChildren || hasPath;
      })
      .map(child => convertRouteToInspectFormat(child));
  }

  return inspectRoute;
}

async function generateInspectReportForEntry(
  entrypoint: Entrypoint,
  appContext: AppToolsContext,
  config: AppNormalizedConfig,
  api: CLIPluginAPI<AppTools>,
): Promise<{ entryName: string; routes: RouteInspectInfo[] }> {
  const { entryName } = entrypoint;

  console.log(`🔍 Analyzing routes for entry "${entryName}"...`);

  const routes = await generateRoutesForEntry(entrypoint, appContext);

  if (routes.length === 0) {
    console.log(`⚠️  No routes found for entry "${entryName}"`);
    return {
      entryName,
      routes: [],
    };
  }

  // Apply route modification hooks
  const hooks = api.getHooks();
  const clonedRoutes = cloneDeep(routes);
  const { routes: finalRoutes } = await hooks.modifyFileSystemRoutes.call({
    entrypoint,
    routes: clonedRoutes,
  });

  // Convert to inspection report format
  const inspectRoutes = finalRoutes
    .filter(route => {
      // Keep all valid routes, including pathless layouts
      const hasComponent = Boolean(route._component);
      const hasChildren =
        'children' in route && route.children && route.children.length > 0;
      const hasPath = route.path !== undefined;

      return hasComponent || hasChildren || hasPath;
    })
    .map(route => convertRouteToInspectFormat(route as NestedRouteForCli));

  console.log(
    `✅ Found ${inspectRoutes.length} routes for entry "${entryName}"`,
  );

  return {
    entryName,
    routes: inspectRoutes,
  };
}

export async function generateRoutesInspectReport(
  api: CLIPluginAPI<AppTools>,
): Promise<void> {
  try {
    console.log('🚀 Start generating route inspection report...\n');

    const appContext = api.getAppContext();
    const config = api.getNormalizedConfig();
    const { entrypoints, distDirectory } = appContext;

    const modifiedEntrypoints = modifyEntrypoints(entrypoints);

    // Filter entrypoints that contain routes (either routes directory or config routes)
    // Since we can't easily check for config routes without scanning all files,
    // we'll include all auto-mount entrypoints and let generateRoutesForEntry handle the logic
    const routesEntrypoints = modifiedEntrypoints.filter(
      entrypoint => entrypoint.isAutoMount,
    );

    if (routesEntrypoints.length === 0) {
      console.log(
        '⚠️  No entrypoints with routes (file-system or config-based) were found',
      );
      return;
    }

    console.log(`📁 Found ${routesEntrypoints.length} entrypoints with routes`);

    const reports: Array<{ entryName: string; routes: RouteInspectInfo[] }> =
      [];

    // Generate report for each entrypoint
    for (const entrypoint of routesEntrypoints) {
      if (entrypoint.nestedRoutesEntry) {
        const report = await generateInspectReportForEntry(
          entrypoint,
          appContext,
          config,
          api,
        );
        reports.push(report);
      }
    }

    // Generate the final report object
    let finalReport: RoutesInspectReport | MultiEntryRoutesInspectReport;

    if (reports.length === 1) {
      // Single entry case
      finalReport = {
        routes: reports[0]!.routes,
      };
    } else {
      // Multiple entries case
      finalReport = {};
      for (const report of reports) {
        (finalReport as MultiEntryRoutesInspectReport)[report.entryName] = {
          routes: report.routes,
        };
      }
    }

    // Ensure output directory exists
    await fs.ensureDir(distDirectory);

    // Write report file
    const reportPath = path.join(distDirectory, 'routes-inspect.json');
    await fs.writeJSON(reportPath, finalReport, { spaces: 2 });

    console.log(
      `\n✨ Route inspection report has been generated: ${reportPath}`,
    );

    const totalRoutes = reports.reduce(
      (sum, report) => sum + report.routes.length,
      0,
    );
    console.log(
      `📊 Found a total of ${totalRoutes} routes across ${reports.length} entrypoints`,
    );
  } catch (error) {
    console.error('❌ Failed to generate route inspection report:', error);
    process.exit(1);
  }
}
