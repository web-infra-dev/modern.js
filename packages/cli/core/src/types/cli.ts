import { AsyncWaterfall, AsyncWorkflow } from '@modern-js/plugin';
import {
  Entrypoint,
  HtmlPartials,
  NestedRoute,
  PageRoute,
  RouteLegacy,
  ServerRoute,
} from '@modern-js/types';

export interface ImportSpecifier {
  local?: string;
  imported?: string;
}

export interface ImportStatement {
  specifiers: ImportSpecifier[];
  value: string;
  initialize?: string;
}

export interface RuntimePlugin {
  name: string;
  options: string;
  args?: string;
}

export interface Hooks {
  afterMonorepoDeploy: AsyncWorkflow<
    { operator: any; deployProjectNames: string[] },
    void
  >;
  modifyEntryExport: AsyncWaterfall<{
    entrypoint: Entrypoint;
    exportStatement: string;
  }>;
  modifyEntryImports: AsyncWaterfall<{
    imports: ImportStatement[];
    entrypoint: Entrypoint;
  }>;
  modifyEntryRuntimePlugins: AsyncWaterfall<{
    entrypoint: Entrypoint;
    plugins: RuntimePlugin[];
  }>;
  modifyEntryRenderFunction: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  modifyAsyncEntry: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  modifyFileSystemRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    routes: RouteLegacy[] | (NestedRoute | PageRoute)[];
  }>;
  modifyServerRoutes: AsyncWaterfall<{
    routes: ServerRoute[];
  }>;
  htmlPartials: AsyncWaterfall<{
    entrypoint: Entrypoint;
    partials: HtmlPartials;
  }>;
  addRuntimeExports: AsyncWaterfall<void>;
  beforeGenerateRoutes: AsyncWaterfall<{
    entrypoint: Entrypoint;
    code: string;
  }>;
  addDefineTypes: AsyncWaterfall<void>;
}
