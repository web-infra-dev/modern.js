import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { ROUTE_MANIFEST_FILE } from '@modern-js/utils';
import { RESOURCE_STAGES } from '@modern-js/utils/universal/constants';
import type { Rspack } from '@rsbuild/core';
import {
  type NormalizedResourceStages,
  type ResourceStagesUserConfig,
  normalizeResourceStages,
} from '../resourceStages/config';
import { parseStageDeclarations } from '../resourceStages/parse';
import {
  type ChunkId,
  type ChunkInfo,
  type DeclarationInfo,
  type EntryInfo,
  type Plan,
  type PreloadItem,
  type RouteInfo,
  type Snapshot,
  type TargetPlan,
  checkBudgets,
  formatBytes,
  planResourceStages,
} from '../resourceStages/plan';

const PLUGIN_NAME = 'ModernjsResourceStagesPlugin';
const PLACEHOLDER = '<!--modern-resource-stages-->';
export const RESOURCE_STAGES_REPORT_FILE = 'resource-stages.json';

/** The runtime module that implements `stagedImport`. */
const RUNTIME_MODULE =
  /[\\/]core[\\/]resources[\\/]stagedImport\.[cm]?[jt]sx?$/;
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;

type Compiler = Rspack.Compiler;
type Compilation = Rspack.Compilation;
type ChunkGroup = Compilation['chunkGroups'][number];
type Module = Compilation['modules'] extends ReadonlySet<infer M> ? M : never;

export interface ResourceStagesPluginOptions {
  HtmlBundlerPlugin: typeof Rspack.HtmlRspackPlugin;
  /** `performance.resourceStages`; without it only declarations are handled. */
  config?: ResourceStagesUserConfig;
  appDirectory: string;
  /**
   * Generated code directory. A named chunk group is a route only when it is
   * imported from the generated routes file there; the route manifest also
   * lists other named chunk groups.
   */
  internalDirectory?: string;
  /** Where `modern-resource-stages.d.ts` is written for custom stages. */
  srcDirectory?: string;
  /** The server renders the entry and adds the route lists per request. */
  isServerRendered: (entryName: string) => boolean;
  staticJsDir?: string;
  disableFilenameHash?: boolean;
  nonce?: string;
  crossOriginLoading?: false | 'anonymous' | 'use-credentials';
}

const normalizePublicPath = (publicPath?: string) => {
  if (!publicPath || publicPath === 'auto') {
    return '';
  }
  return publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
};

const contentHash = (content: string) =>
  createHash('md5').update(content).digest('hex').slice(0, 8);

const serialize = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const payloadScript = (payload: unknown) =>
  `(self.${RESOURCE_STAGES}=self.${RESOURCE_STAGES}||[]).push(${serialize(payload)})`;

const getResourcePath = (module: Module | null | undefined) => {
  if (!module) {
    return undefined;
  }
  const resource =
    (module as { resource?: string }).resource ??
    (
      module as { nameForCondition?: () => string | undefined }
    ).nameForCondition?.();
  return resource?.replace(/\?.*$/, '');
};

/**
 * Build half of `performance.resourceStages`: finds the `stagedImport`
 * declarations, maps them to chunks with the chunk graph, writes the entry
 * level preloads and stage lists into the HTML, the route level ones into the
 * route manifest for the server, checks the budgets and outputs
 * `resource-stages.json` for analysis.
 */
export class ResourceStagesPlugin {
  readonly name = 'ResourceStagesPlugin';

  private options: ResourceStagesPluginOptions;

  private stages: NormalizedResourceStages;

  /** Parsed declarations by file, reused while the file is unchanged. */
  private parseCache = new Map<
    string,
    { mtime: number; result: ReturnType<typeof parseStageDeclarations> }
  >();

  constructor(options: ResourceStagesPluginOptions) {
    this.options = options;
    this.stages = normalizeResourceStages(options.config);
    this.writeStageTypes();
  }

  /** Type declaration of the custom stages, rewritten only when it changes. */
  private writeStageTypes() {
    const { srcDirectory } = this.options;
    const custom = this.stages.order.filter(
      stage => !['visible', 'interactive', 'idle'].includes(stage),
    );
    if (!srcDirectory || !custom.length) {
      return;
    }
    const file = path.join(srcDirectory, 'modern-resource-stages.d.ts');
    const content = `// Generated from performance.resourceStages.stages, do not edit.
declare global {
  interface ModernResourceStages {
${custom.map(stage => `    ${JSON.stringify(stage)}: true;`).join('\n')}
  }
}

export {};
`;
    try {
      if (fs.existsSync(file) && fs.readFileSync(file, 'utf-8') === content) {
        return;
      }
      fs.writeFileSync(file, content);
    } catch {
      // Types are a convenience; a read-only source tree must not fail the build.
    }
  }

  apply(compiler: Compiler) {
    const { target } = compiler.options;
    const targets = Array.isArray(target) ? target : [target];
    if (targets.some(t => typeof t === 'string' && /node|webworker/.test(t))) {
      return;
    }
    const { Compilation, sources, WebpackError } = compiler.rspack;

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      const htmlNames = new Map<string, string>();
      this.options.HtmlBundlerPlugin.getCompilationHooks(
        compilation,
      ).beforeEmit.tapAsync(PLUGIN_NAME, (data, callback) => {
        const chunks = (data.plugin.options?.chunks ?? []) as string[];
        for (const chunk of Array.isArray(chunks) ? chunks : []) {
          htmlNames.set(chunk, data.outputName);
        }
        data.html = data.html.includes('</head>')
          ? data.html.replace('</head>', `${PLACEHOLDER}</head>`)
          : data.html;
        callback(null, data);
      });

      compilation.hooks.processAssets.tapPromise(
        {
          name: PLUGIN_NAME,
          // After RouterPlugin writes the route manifest.
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT + 1,
        },
        async () => {
          const report = (message: string, isError = false) => {
            const error = new WebpackError(`[resource stages] ${message}`);
            (isError ? compilation.errors : compilation.warnings).push(error);
          };
          const htmlParts = new Map<string, string>();
          try {
            const result = this.run(compilation, report);
            if (result) {
              for (const [entry, html] of result.html) {
                htmlParts.set(entry, html);
              }
              this.emitFiles(compilation, result, sources.RawSource);
            }
          } finally {
            // Always remove the placeholder.
            for (const [entry, htmlName] of htmlNames) {
              const asset = compilation.getAsset(htmlName);
              if (!asset) {
                continue;
              }
              const html = asset.source.source().toString();
              if (!html.includes(PLACEHOLDER)) {
                continue;
              }
              compilation.updateAsset(
                htmlName,
                new sources.RawSource(
                  html.replace(PLACEHOLDER, htmlParts.get(entry) ?? ''),
                ),
              );
            }
          }
        },
      );
    });
  }

  private run(
    compilation: Compilation,
    report: (message: string, isError?: boolean) => void,
  ) {
    const usesRuntime = [...compilation.modules].some(module =>
      RUNTIME_MODULE.test(getResourcePath(module) ?? ''),
    );
    if (!usesRuntime && !this.options.config) {
      return undefined;
    }

    const { publicPath } = compilation
      .getStats()
      .toJson({ all: false, publicPath: true });
    const prefix = normalizePublicPath(publicPath);
    const routeManifest = this.readRouteManifest(compilation);
    const snapshot = this.collect(compilation, prefix, routeManifest, report);
    const routeRule =
      Boolean(this.options.config) && this.options.config?.routes !== false;
    const plan = planResourceStages(snapshot, this.stages, { routeRule });
    for (const warning of plan.warnings) {
      report(warning);
    }

    const duplicates = this.findDuplicateModules(compilation, snapshot, plan);
    for (const target of plan.targets) {
      const entry = snapshot.entries.get(target.entry);
      const entryBytes = [...(entry?.initial ?? [])].reduce<number>(
        (sum, id) => sum + (snapshot.chunks.get(id)?.size ?? 0),
        0,
      );
      for (const warning of checkBudgets(target, this.stages, entryBytes)) {
        report(warning);
      }
      for (const [stage, count] of duplicates.get(target) ?? []) {
        report(
          `${target.kind} "${target.name}": ${count} modules of stage "${stage}" are also bundled into chunks of another stage.`,
        );
      }
    }
    this.compareBaseline(plan, report);

    return this.render(
      compilation,
      snapshot,
      plan,
      routeManifest,
      routeRule,
      report,
      duplicates,
    );
  }

  private readRouteManifest(compilation: Compilation) {
    const asset = compilation.getAsset(ROUTE_MANIFEST_FILE);
    if (!asset) {
      return undefined;
    }
    try {
      return JSON.parse(asset.source.source().toString()) as {
        routeAssets?: Record<string, unknown>;
        [key: string]: unknown;
      };
    } catch {
      return undefined;
    }
  }

  private collect(
    compilation: Compilation,
    prefix: string,
    routeManifest: ReturnType<ResourceStagesPlugin['readRouteManifest']>,
    report: (message: string, isError?: boolean) => void,
  ): Snapshot {
    const { chunkGraph } = compilation;
    const sizes = new Map<string, number>();
    const getSize = (file: string) => {
      let size = sizes.get(file);
      if (size === undefined) {
        const asset = compilation.getAsset(file);
        size = asset ? gzipSync(asset.source.buffer()).length : 0;
        sizes.set(file, size);
      }
      return size;
    };

    const chunks = new Map<ChunkId, ChunkInfo>();
    for (const chunk of compilation.chunks) {
      const id = chunk.id;
      if (id === undefined || id === null) {
        continue;
      }
      const files = [...chunk.files].filter(
        file => !file.endsWith('.map') && !file.includes('.hot-update.'),
      );
      const js = files.filter(file => /\.[cm]?js$/.test(file));
      const css = files.filter(file => file.endsWith('.css'));
      chunks.set(id, {
        id,
        js: js.map(file => prefix + file),
        css: css.map(file => prefix + file),
        get size() {
          return [...js, ...css].reduce((sum, file) => sum + getSize(file), 0);
        },
      });
    }
    // Compare chunks by id: the binding returns a new wrapper object per call.
    const idsOf = (group: ChunkGroup) =>
      group.chunks
        .map(chunk => chunk.id ?? undefined)
        .filter((id): id is ChunkId => id !== undefined);

    // Groups are keyed by their chunk ids for the same reason.
    const groupKey = (group: ChunkGroup) =>
      `${group.name ?? ''}|${idsOf(group).join(',')}`;
    // Reachable chunks and async depth from each entry.
    const depthOf = new Map<string, number>();
    const reachableFrom = (root: ChunkGroup, depth?: number) => {
      const reachable = new Set<ChunkId>();
      const visited = new Set<string>();
      const stack: [ChunkGroup, number][] = [[root, 0]];
      while (stack.length) {
        const [group, level] = stack.pop()!;
        const key = groupKey(group);
        if (visited.has(key)) {
          continue;
        }
        visited.add(key);
        if (depth !== undefined) {
          const known = depthOf.get(key);
          if (known === undefined || level < known) {
            depthOf.set(key, level);
          }
        }
        for (const id of idsOf(group)) {
          reachable.add(id);
        }
        for (const child of group.childrenIterable) {
          stack.push([child, level + 1]);
        }
      }
      return reachable;
    };

    const entries = new Map<string, EntryInfo>();
    for (const [name, entrypoint] of compilation.entrypoints) {
      entries.set(name, {
        initial: new Set(idsOf(entrypoint as unknown as ChunkGroup)),
        reachable: reachableFrom(entrypoint as unknown as ChunkGroup, 0),
        serverRendered: this.options.isServerRendered(name),
      });
    }

    const routes = new Map<string, RouteInfo>();
    for (const name of Object.keys(routeManifest?.routeAssets ?? {})) {
      if (entries.has(name) || name.startsWith('async-')) {
        continue;
      }
      const group = compilation.namedChunkGroups.get(name) as
        ChunkGroup | undefined;
      if (!group || !this.isRouteGroup(group)) {
        continue;
      }
      const chunkIds = idsOf(group);
      const entry = [...entries].find(([, info]) =>
        chunkIds.some(id => info.reachable.has(id)),
      )?.[0];
      if (!entry) {
        continue;
      }
      routes.set(name, {
        entry,
        chunks: chunkIds,
        own: new Set(
          group.chunks
            .filter(chunk => chunk.name === name)
            .map(chunk => chunk.id ?? undefined)
            .filter((id): id is ChunkId => id !== undefined),
        ),
        reachable: reachableFrom(group),
      });
    }

    // `import()` sites: declaring file + request -> async chunk groups.
    const groupsByOrigin = new Map<string, ChunkGroup[]>();
    for (const group of compilation.chunkGroups) {
      if (group.isInitial()) {
        continue;
      }
      for (const origin of group.origins) {
        const resource = getResourcePath(origin.module);
        if (!resource || !origin.request) {
          continue;
        }
        const key = `${resource}\0${origin.request}`;
        groupsByOrigin.set(key, [...(groupsByOrigin.get(key) ?? []), group]);
      }
    }

    // Production builds concatenate modules: the chunk graph then has the
    // concatenated module, not the inner module that declares.
    const concatenatedOf = new Map<string, Module>();
    for (const module of compilation.modules) {
      const inner = (module as { modules?: Module[] }).modules;
      if (!Array.isArray(inner)) {
        continue;
      }
      for (const item of inner) {
        const resource = getResourcePath(item);
        if (resource) {
          concatenatedOf.set(resource, module);
        }
      }
    }
    const chunksOfModule = (module: Module, resource: string) => {
      let chunks = chunkGraph.getModuleChunks(module);
      const concatenated = concatenatedOf.get(resource);
      if (!chunks.length && concatenated) {
        chunks = chunkGraph.getModuleChunks(concatenated);
      }
      return chunks
        .map(chunk => chunk.id ?? undefined)
        .filter((id): id is ChunkId => id !== undefined);
    };

    const declarations: DeclarationInfo[] = [];
    const scanned = new Set<string>();
    for (const module of compilation.modules) {
      const resource = getResourcePath(module);
      if (
        !resource ||
        scanned.has(resource) ||
        !SOURCE_FILE.test(resource) ||
        !this.shouldScan(resource)
      ) {
        continue;
      }
      scanned.add(resource);
      const result = this.parse(resource);
      for (const error of result.errors) {
        report(error, true);
      }
      if (!result.declarations.length) {
        continue;
      }
      const declaringChunks = chunksOfModule(module, resource);
      const file = path.relative(this.options.appDirectory, resource);
      for (const declaration of result.declarations) {
        const groups =
          groupsByOrigin.get(`${resource}\0${declaration.request}`) ?? [];
        const chunkIds = [...new Set(groups.flatMap(idsOf))];
        declarations.push({
          ...declaration,
          file,
          chunks: chunkIds,
          depth: Math.max(
            0,
            ...groups.map(group => depthOf.get(groupKey(group)) ?? 0),
          ),
          declaringChunks,
        });
      }
    }

    return { chunks, entries, routes, declarations };
  }

  private isRouteGroup(group: ChunkGroup) {
    const { internalDirectory } = this.options;
    if (!internalDirectory) {
      return true;
    }
    return group.origins.some(origin =>
      getResourcePath(origin.module)?.startsWith(internalDirectory),
    );
  }

  private shouldScan(resource: string) {
    if (!/[\\/]node_modules[\\/]/.test(resource)) {
      return true;
    }
    return (this.options.config?.include ?? []).some(pattern =>
      typeof pattern === 'string'
        ? resource.includes(pattern)
        : pattern.test(resource),
    );
  }

  private parse(resource: string) {
    let mtime = 0;
    try {
      mtime = fs.statSync(resource).mtimeMs;
    } catch {
      return { declarations: [], errors: [] };
    }
    const cached = this.parseCache.get(resource);
    if (cached && cached.mtime === mtime) {
      return cached.result;
    }
    const source = fs.readFileSync(resource, 'utf-8');
    const result = parseStageDeclarations(
      source,
      path.relative(this.options.appDirectory, resource),
      this.stages.known,
    );
    this.parseCache.set(resource, { mtime, result });
    return result;
  }

  /** Modules bundled into chunks of more than one stage of the same target. */
  private findDuplicateModules(
    compilation: Compilation,
    snapshot: Snapshot,
    plan: Plan,
  ) {
    const result = new Map<TargetPlan, Map<string, number>>();
    const chunkById = new Map<
      ChunkId,
      Compilation['chunks'] extends ReadonlySet<infer C> ? C : never
    >();
    for (const chunk of compilation.chunks) {
      if (chunk.id !== undefined && chunk.id !== null) {
        chunkById.set(chunk.id, chunk);
      }
    }
    const modulesOf = new Map<ChunkId, Set<string>>();
    const getModules = (id: ChunkId) => {
      let modules = modulesOf.get(id);
      if (!modules) {
        const chunk = chunkById.get(id);
        modules = new Set(
          chunk
            ? compilation.chunkGraph
                .getChunkModules(chunk)
                .map(module => getResourcePath(module) ?? '')
                .filter(Boolean)
            : [],
        );
        modulesOf.set(id, modules);
      }
      return modules;
    };
    for (const target of plan.targets) {
      const stagesOfModule = new Map<string, Set<string>>();
      const chunkStages: [ChunkId, string][] = [
        ...Object.entries(target.lists).flatMap(([stage, ids]) =>
          ids.map(id => [id, stage] as [ChunkId, string]),
        ),
        ...Object.entries(target.routeLists).flatMap(([stage, ids]) =>
          ids.map(id => [id, stage] as [ChunkId, string]),
        ),
      ];
      const criticalUrls = new Set(
        [...target.critical, ...target.routeCritical].map(item => item.h),
      );
      for (const chunk of snapshot.chunks.values()) {
        if ([...chunk.js, ...chunk.css].some(file => criticalUrls.has(file))) {
          chunkStages.push([chunk.id, 'critical']);
        }
      }
      for (const [id, stage] of chunkStages) {
        for (const module of getModules(id)) {
          const stages = stagesOfModule.get(module) ?? new Set();
          stages.add(stage);
          stagesOfModule.set(module, stages);
        }
      }
      const counts = new Map<string, number>();
      for (const stages of stagesOfModule.values()) {
        if (stages.size > 1) {
          for (const stage of stages) {
            counts.set(stage, (counts.get(stage) ?? 0) + 1);
          }
        }
      }
      if (counts.size) {
        result.set(target, counts);
      }
    }
    return result;
  }

  private compareBaseline(
    plan: Plan,
    report: (message: string, isError?: boolean) => void,
  ) {
    const baselinePath = this.options.config?.baseline;
    if (!baselinePath) {
      return;
    }
    const file = path.resolve(this.options.appDirectory, baselinePath);
    let baseline: {
      targets?: {
        kind: string;
        name: string;
        stats: Record<string, { bytes: number }>;
      }[];
    };
    try {
      baseline = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      report(`baseline ${baselinePath} could not be read, skipped.`);
      return;
    }
    const threshold = this.options.config?.baselineThreshold ?? 10;
    for (const target of plan.targets) {
      const previous = baseline.targets?.find(
        item => item.kind === target.kind && item.name === target.name,
      );
      for (const [stage, stats] of Object.entries(target.stats)) {
        const before = previous?.stats?.[stage]?.bytes;
        if (!before) {
          continue;
        }
        const growth = ((stats.bytes - before) / before) * 100;
        if (growth > threshold) {
          report(
            `${target.kind} "${target.name}": stage "${stage}" grew ${growth.toFixed(1)}% over the baseline (${formatBytes(before)} -> ${formatBytes(stats.bytes)}).`,
          );
        }
      }
    }
  }

  private render(
    compilation: Compilation,
    snapshot: Snapshot,
    plan: Plan,
    routeManifest: ReturnType<ResourceStagesPlugin['readRouteManifest']>,
    routeRule: boolean,
    report: (message: string, isError?: boolean) => void,
    duplicates: Map<TargetPlan, Map<string, number>>,
  ) {
    const { stages, options } = this;
    const runtimeConfig = {
      o: stages.order,
      ...(stages.manual.length ? { m: stages.manual } : {}),
      ...(Object.keys(stages.timeouts).length ? { t: stages.timeouts } : {}),
      ...(stages.config.concurrency ? { n: stages.config.concurrency } : {}),
      ...(options.crossOriginLoading ? { x: options.crossOriginLoading } : {}),
      ...(stages.config.idleQuietTime !== undefined
        ? { i: stages.config.idleQuietTime }
        : {}),
    };

    const files = new Map<string, string>();
    const staticJsDir = options.staticJsDir ?? 'static/js';
    const externalize = (name: string, payload: object) => {
      const content = payloadScript(payload);
      const file = `${staticJsDir}/resource-stages/${name.replace(/[^\w.-]/g, '_')}${
        options.disableFilenameHash ? '' : `.${contentHash(content)}`
      }.js`;
      files.set(file, content);
      const { publicPath } = compilation
        .getStats()
        .toJson({ all: false, publicPath: true });
      return normalizePublicPath(publicPath) + file;
    };
    const fits = (payload: object) =>
      gzipSync(serialize(payload)).length <= stages.inlineLimit;
    const lists = (target: TargetPlan, withRouteRule: boolean) => {
      const merged: Record<string, ChunkId[]> = {};
      for (const [stage, ids] of Object.entries(target.lists)) {
        merged[stage] = [...ids];
      }
      if (withRouteRule) {
        for (const [stage, ids] of Object.entries(target.routeLists)) {
          merged[stage] = [...(merged[stage] ?? []), ...ids];
        }
      }
      return merged;
    };
    const cssOf = (target: TargetPlan, merged: Record<string, ChunkId[]>) => {
      const css: Record<string, string[]> = {};
      for (const id of Object.values(merged).flat()) {
        if (target.css[String(id)]) {
          css[String(id)] = target.css[String(id)];
        }
      }
      return css;
    };

    // Route level part for the server, in the route manifest.
    const manifestRoutes: Record<string, Record<string, unknown>> = {};
    const routeTargets = plan.targets.filter(target => target.kind === 'route');
    for (const target of routeTargets) {
      const route: Record<string, unknown> = {};
      if (target.critical.length) route.c = target.critical;
      if (target.routeCritical.length) route.rc = target.routeCritical;
      const declared = lists(target, false);
      const all = lists(target, true);
      const declaredPayload = { s: declared, k: cssOf(target, declared) };
      const allPayload = { s: all, k: cssOf(target, all) };
      if (Object.keys(declared).length) {
        if (fits(declaredPayload)) {
          route.s = declared;
          route.k = declaredPayload.k;
        } else {
          route.u = externalize(`${target.name}`, declaredPayload);
          report(
            `route "${target.name}": its stage list is over ${formatBytes(stages.inlineLimit)} compressed and is loaded from a separate file after first paint.`,
          );
        }
      }
      if (Object.keys(target.routeLists).length) {
        route.rs = target.routeLists;
        if (route.u || !fits(allPayload)) {
          route.ur = externalize(`${target.name}-routes`, allPayload);
        } else {
          route.k = allPayload.k;
        }
      }
      manifestRoutes[target.name] = route;
    }

    // Entry level part, written into the HTML at build time.
    const html = new Map<string, string>();
    for (const [entryName, entry] of snapshot.entries) {
      const target = plan.targets.find(
        item => item.kind === 'entry' && item.name === entryName,
      );
      const payload: Record<string, unknown> = { c: runtimeConfig };
      const preloads: PreloadItem[] = [...(target?.critical ?? [])];
      if (target) {
        const merged = lists(target, false);
        if (Object.keys(merged).length) {
          payload.s = merged;
          const css = cssOf(target, merged);
          if (Object.keys(css).length) payload.k = css;
        }
      }
      // Client rendered entries pick the route lists in the browser.
      if (!entry.serverRendered) {
        const routeLists: Record<string, unknown> = {};
        for (const routeTarget of routeTargets) {
          if (routeTarget.entry !== entryName) continue;
          const merged = lists(routeTarget, false);
          if (Object.keys(merged).length) {
            routeLists[routeTarget.name] = {
              s: merged,
              k: cssOf(routeTarget, merged),
            };
          }
        }
        if (Object.keys(routeLists).length) {
          payload.r = routeLists;
        }
      }
      if (
        !payload.s &&
        !payload.r &&
        !preloads.length &&
        !this.options.config
      ) {
        continue;
      }
      let inline: Record<string, unknown> = payload;
      if (!fits(payload)) {
        const { c, ...rest } = payload;
        inline = { c, u: externalize(`entry-${entryName}`, rest) };
        report(
          `entry "${entryName}": its stage list is over ${formatBytes(stages.inlineLimit)} compressed and is loaded from a separate file after first paint.`,
        );
      }
      const nonce = options.nonce ? ` nonce="${options.nonce}"` : '';
      const preloadTags = preloads
        .map(
          item =>
            `<link rel="preload" as="${item.a}" href="${item.h}"${
              options.crossOriginLoading &&
              (options.crossOriginLoading === 'use-credentials' ||
                /^([a-z][a-z\d+\-.]*:)?\/\//i.test(item.h))
                ? ` crossorigin="${options.crossOriginLoading}"`
                : ''
            }${item.l ? ' fetchpriority="low"' : ''}>`,
        )
        .join('');
      html.set(
        entryName,
        `${preloadTags}<script${nonce}>${payloadScript(inline)}</script>`,
      );
    }

    const manifest = {
      version: 1 as const,
      routeRule,
      routes: manifestRoutes,
    };

    const reportFile = {
      version: 1,
      network: stages.network,
      order: ['critical', ...stages.order],
      targets: plan.targets.map(target => ({
        kind: target.kind,
        name: target.name,
        entry: target.entry,
        stats: target.stats,
        duplicates: Object.fromEntries(duplicates.get(target) ?? []),
      })),
      declarations: plan.declarations.map(item => ({
        file: item.file,
        line: item.line,
        request: item.request,
        stage: item.stage,
        level: item.level,
        depth: item.depth,
        chunks: item.chunks.map(id => {
          const chunk = snapshot.chunks.get(id);
          return {
            id,
            files: chunk ? [...chunk.js, ...chunk.css] : [],
            size: chunk?.size ?? 0,
          };
        }),
      })),
    };

    return { html, manifest, files, reportFile, routeManifest };
  }

  private emitFiles(
    compilation: Compilation,
    result: NonNullable<ReturnType<ResourceStagesPlugin['run']>>,
    RawSource: typeof Rspack.sources.RawSource,
  ) {
    for (const [file, content] of result.files) {
      compilation.emitAsset(file, new RawSource(content));
    }
    if (result.routeManifest) {
      compilation.updateAsset(
        ROUTE_MANIFEST_FILE,
        new RawSource(
          JSON.stringify(
            { ...result.routeManifest, resourceStages: result.manifest },
            null,
            2,
          ),
        ),
      );
    }
    const content = JSON.stringify(result.reportFile, null, 2);
    if (compilation.getAsset(RESOURCE_STAGES_REPORT_FILE)) {
      compilation.updateAsset(
        RESOURCE_STAGES_REPORT_FILE,
        new RawSource(content),
      );
    } else {
      compilation.emitAsset(
        RESOURCE_STAGES_REPORT_FILE,
        new RawSource(content),
      );
    }
  }
}
