import { createRequire } from 'node:module';
import path from 'node:path';

export const SNAPSHOT_EXPIRED_CODE = 'MODERN_APPLICATIONS_SNAPSHOT_EXPIRED';

function normalizeExpose(expose) {
  const trimmed = String(expose || '').trim();
  if (!trimmed || trimmed === '.') return '.';
  return trimmed.startsWith('./')
    ? trimmed
    : `./${trimmed.replace(/^\/+/, '')}`;
}

function normalizeRoutePattern(route) {
  return String(route || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function childSourceKey(moduleName, expose, versionOrUrl) {
  return `${moduleName}::${normalizeExpose(expose)}::${versionOrUrl}`;
}

function normalizePathname(pathname) {
  if (!pathname) return '/';
  const clean = String(pathname).replace(/\/{2,}/g, '/');
  if (clean === '/') return '/';
  return clean.replace(/\/+$/, '') || '/';
}

function relativePathname(pathname, basename) {
  const full = normalizePathname(pathname);
  const base = normalizePathname(basename || '/');
  if (base === '/') return full.replace(/^\/+/, '');
  if (full === base) return '';
  if (full.startsWith(`${base}/`)) return full.slice(base.length + 1);
  return null;
}

function routeMatchesRelative(pattern, relPath) {
  if (relPath === null) return false;
  const normPattern = normalizeRoutePattern(pattern);
  if (!normPattern || normPattern === '*') return true;

  const pSegs = normPattern.split('/').filter(Boolean);
  const rSegs = relPath.split('/').filter(Boolean);

  for (let i = 0; i < pSegs.length; i++) {
    const seg = pSegs[i];
    if (seg === '*') {
      // Matches the prefix itself or any subpath under it
      return true;
    }
    if (i >= rSegs.length) return false;
    if (seg.startsWith(':')) continue;
    if (seg !== rSegs[i]) return false;
  }
  return rSegs.length === pSegs.length;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export function createLabDeploymentPlatform({ root, ports }) {
  const hostRequire = createRequire(path.join(root, 'host/package.json'));
  const enhancedRequire = createRequire(
    hostRequire.resolve('@module-federation/enhanced/runtime'),
  );
  const sdk = enhancedRequire('@module-federation/sdk');
  const { generateSnapshotFromManifest } = sdk;

  const providerV1Url = `http://localhost:${ports.provider}/static/mf-manifest.json`;
  const providerV2Url = ports.providerV2
    ? `http://localhost:${ports.providerV2}/static/mf-manifest.json`
    : undefined;
  const nestedUrl = ports.nested
    ? `http://localhost:${ports.nested}/static/mf-manifest.json`
    : undefined;

  const defaultConfigs = () => ({
    portal: {
      consumer: 'lab_dynamic_consumer',
      deliveryMode: 'full', // 'full' | 'layered'
      pathClipped: false,
      applications: [
        {
          id: 'weather',
          title: 'Producer A · Weather App (Nested)',
          enabled: true,
          route: 'weather/*',
          manifestUrl: providerV1Url,
          expose: './WeatherApplication',
          childrenMode: 'dynamic', // 'dynamic' | 'fixed' | 'none'
          childrenSource: 'weather-children',
          props: { label: 'Hangzhou · Dynamic Portal' },
        },
        {
          id: 'products',
          title: 'Producer B · Product App',
          enabled: true,
          route: 'products/*',
          manifestUrl: providerV1Url,
          expose: './ProductApp',
          childrenMode: 'none',
          props: {},
        },
      ],
    },
    'weather-children': {
      consumer: 'lab_provider',
      consumerManifestUrl: providerV1Url,
      applications: nestedUrl
        ? [
            {
              id: 'wind',
              title: 'Producer C · Nested Wind App',
              enabled: true,
              route: 'wind/*',
              manifestUrl: nestedUrl,
              expose: './WindApplication',
              childrenMode: 'none',
              props: { station: 'West Lake Ridge' },
            },
          ]
        : [],
    },
  });

  const manifestCache = new Map();
  async function loadManifest(manifestUrl, forceRefresh = false) {
    if (!forceRefresh && manifestCache.has(manifestUrl)) {
      return manifestCache.get(manifestUrl);
    }
    const response = await fetch(manifestUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch manifest "${manifestUrl}": HTTP ${response.status}`,
      );
    }
    const manifest = await response.json();
    if (!manifest || !manifest.name || !manifest.metaData) {
      throw new Error(`Invalid MF manifest at "${manifestUrl}".`);
    }
    manifestCache.set(manifestUrl, manifest);
    return manifest;
  }

  let seq = 0;
  let initialized = false;
  let initPromise = null;
  let configs = defaultConfigs();

  const revisions = new Map(); // source -> Map<deploymentId, snapshot>
  const activeIds = new Map(); // source -> deploymentId
  const history = new Map(); // source -> Array<{ deploymentId, sid, publishedAt, summary }>
  const discoveryLogs = [];

  async function computeSourceSnapshot(
    sourceName,
    config,
    forceManifestRefresh,
  ) {
    const sid = `${sourceName}-r${++seq}`;
    const routes = [];
    const moduleInfo = {};
    const sources = {};
    const fixedChildren = {};
    let hasFixedChildren = false;
    const consumerRemotesInfo = {};
    const seenRoutes = new Set();

    for (const app of config.applications || []) {
      if (!app.enabled) continue;
      const cleanRoute = String(app.route || '').trim();
      if (!cleanRoute) {
        throw new Error(
          `Application "${app.id || app.expose}" requires a route.`,
        );
      }
      const normRoute = normalizeRoutePattern(cleanRoute);
      if (seenRoutes.has(normRoute)) {
        throw new Error(`Duplicate route "${cleanRoute}" in "${sourceName}".`);
      }
      seenRoutes.add(normRoute);

      const manifest = await loadManifest(
        app.manifestUrl,
        forceManifestRefresh,
      );
      const normalizedExpose = normalizeExpose(app.expose);
      const bareExpose = normalizedExpose.startsWith('./')
        ? normalizedExpose.slice(2)
        : normalizedExpose;
      const exposes = manifest.exposes || [];
      const foundExpose = exposes.some(
        item =>
          item.path === normalizedExpose ||
          item.name === bareExpose ||
          item.name === normalizedExpose,
      );
      if (!foundExpose) {
        throw new Error(
          `Expose "${app.expose}" does not exist in manifest "${manifest.name}" (${app.manifestUrl}).`,
        );
      }

      const snapshot = generateSnapshotFromManifest(manifest, {
        version: app.manifestUrl,
      });
      moduleInfo[`${manifest.name}:${app.manifestUrl}`] = snapshot;
      consumerRemotesInfo[manifest.name] = { matchedVersion: app.manifestUrl };

      const childrenEnabled =
        app.childrenMode === 'dynamic' || app.childrenMode === 'fixed';
      routes.push({
        route: cleanRoute,
        moduleName: manifest.name,
        expose: normalizedExpose,
        versionOrUrl: app.manifestUrl,
        discoverChildren: childrenEnabled,
        ...(app.props && Object.keys(app.props).length
          ? { props: { ...app.props } }
          : {}),
      });

      if (childrenEnabled && app.childrenSource) {
        const key = childSourceKey(
          manifest.name,
          normalizedExpose,
          app.manifestUrl,
        );
        const targetChildId =
          app.childrenMode === 'fixed'
            ? app.fixedDeploymentId || activeIds.get(app.childrenSource)
            : undefined;
        sources[key] = {
          source: app.childrenSource,
          ...(targetChildId ? { deploymentId: targetChildId } : {}),
          producerManifestUrl: app.manifestUrl,
          moduleName: manifest.name,
          expose: normalizedExpose,
          route: cleanRoute,
        };
        if (app.childrenMode === 'fixed' && targetChildId) {
          const childSnap = revisions
            .get(app.childrenSource)
            ?.get(targetChildId);
          if (!childSnap) {
            throw new Error(
              `Pinned child deployment "${app.childrenSource}@${targetChildId}" not found.`,
            );
          }
          fixedChildren[key] = JSON.parse(JSON.stringify(childSnap));
          hasFixedChildren = true;
        }
      }
    }

    moduleInfo[config.consumer] = {
      version: config.consumerManifestUrl || '',
      buildVersion: sid,
      remoteTypes: '',
      remoteTypesZip: '',
      remotesInfo: consumerRemotesInfo,
      shared: [],
    };

    return {
      version: 1,
      consumer: config.consumer,
      ...(config.consumerManifestUrl
        ? { consumerManifestUrl: config.consumerManifestUrl }
        : {}),
      sid,
      deliveryMode: config.deliveryMode || 'full',
      pathClipped: Boolean(config.pathClipped),
      routes,
      moduleInfo,
      sources,
      ...(hasFixedChildren ? { fixedChildren } : {}),
    };
  }

  function saveAndActivate(sourceName, snapshot, summary) {
    let sourceRevs = revisions.get(sourceName);
    if (!sourceRevs) {
      sourceRevs = new Map();
      revisions.set(sourceName, sourceRevs);
    }
    const deploymentId = snapshot.sid;
    sourceRevs.set(deploymentId, snapshot);
    activeIds.set(sourceName, deploymentId);
    let sourceHistory = history.get(sourceName);
    if (!sourceHistory) {
      sourceHistory = [];
      history.set(sourceName, sourceHistory);
    }
    sourceHistory.unshift({
      deploymentId,
      sid: snapshot.sid,
      publishedAt: new Date().toISOString(),
      deliveryMode: snapshot.deliveryMode,
      pathClipped: snapshot.pathClipped,
      routeCount: snapshot.routes.length,
      summary,
    });
    if (sourceHistory.length > 20) sourceHistory.length = 20;
    return deploymentId;
  }

  async function ensureInitialized() {
    if (initialized) return;
    if (!initPromise) {
      initPromise = (async () => {
        const childSnap = await computeSourceSnapshot(
          'weather-children',
          configs['weather-children'],
          false,
        );
        saveAndActivate('weather-children', childSnap, 'Initial default');
        const portalSnap = await computeSourceSnapshot(
          'portal',
          configs.portal,
          false,
        );
        saveAndActivate('portal', portalSnap, 'Initial default');
        initialized = true;
      })().catch(error => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  }

  function filterSnapshotForPath(snapshot, pathname, basename) {
    if (!snapshot.pathClipped) return snapshot;
    const rel = relativePathname(pathname, basename);
    const matchedRoutes = snapshot.routes.filter(route =>
      routeMatchesRelative(route.route, rel),
    );
    const neededModules = new Set(
      matchedRoutes.map(route => `${route.moduleName}:${route.versionOrUrl}`),
    );
    const trimmedModuleInfo = {};
    for (const [key, value] of Object.entries(snapshot.moduleInfo || {})) {
      if (key === snapshot.consumer || neededModules.has(key)) {
        trimmedModuleInfo[key] = value;
      }
    }
    const trimmedSources = {};
    for (const route of matchedRoutes) {
      const key = childSourceKey(
        route.moduleName,
        route.expose,
        route.versionOrUrl,
      );
      if (snapshot.sources?.[key]) {
        trimmedSources[key] = snapshot.sources[key];
      }
    }
    return {
      ...snapshot,
      routes: matchedRoutes,
      moduleInfo: trimmedModuleInfo,
      sources: trimmedSources,
    };
  }

  function attachBundledChildren(snapshot) {
    if (snapshot.deliveryMode !== 'full') return snapshot;
    const bundledChildren = {};
    let hasBundled = false;
    for (const [key, childRef] of Object.entries(snapshot.sources || {})) {
      if (snapshot.fixedChildren?.[key]) continue;
      const childDepId =
        childRef.deploymentId || activeIds.get(childRef.source);
      const childSnap = childDepId
        ? revisions.get(childRef.source)?.get(childDepId)
        : undefined;
      if (childSnap) {
        bundledChildren[key] = JSON.parse(JSON.stringify(childSnap));
        hasBundled = true;
      }
    }
    return hasBundled ? { ...snapshot, bundledChildren } : snapshot;
  }

  function getActiveSnapshot(sourceName, deploymentId) {
    const id = deploymentId || activeIds.get(sourceName);
    if (!id) return undefined;
    return revisions.get(sourceName)?.get(id);
  }

  function serializeState() {
    const portalActive = getActiveSnapshot('portal');
    const childActive = getActiveSnapshot('weather-children');
    return {
      presets: {
        providerV1: providerV1Url,
        providerV2: providerV2Url,
        nested: nestedUrl,
        consumerOrigin: ports.consumer
          ? `http://localhost:${ports.consumer}`
          : undefined,
      },
      sources: {
        portal: {
          config: configs.portal,
          active: portalActive
            ? {
                deploymentId: activeIds.get('portal'),
                sid: portalActive.sid,
                deliveryMode: portalActive.deliveryMode,
                pathClipped: portalActive.pathClipped,
                routes: portalActive.routes,
                sources: portalActive.sources,
                moduleInfoKeys: Object.keys(portalActive.moduleInfo || {}),
                fixedChildKeys: Object.keys(portalActive.fixedChildren || {}),
              }
            : null,
          history: history.get('portal') || [],
        },
        'weather-children': {
          config: configs['weather-children'],
          active: childActive
            ? {
                deploymentId: activeIds.get('weather-children'),
                sid: childActive.sid,
                routes: childActive.routes,
                moduleInfoKeys: Object.keys(childActive.moduleInfo || {}),
              }
            : null,
          history: history.get('weather-children') || [],
        },
      },
      logs: discoveryLogs.slice(0, 60),
    };
  }

  async function handleRequest(req, res, url) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return true;
    }

    const json = (body, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    try {
      await ensureInitialized();

      if (req.method === 'GET' && url.pathname === '/_lab/deployments/state') {
        json(serializeState());
        return true;
      }

      if (
        req.method === 'POST' &&
        url.pathname === '/_lab/deployments/logs/clear'
      ) {
        discoveryLogs.length = 0;
        json({ ok: true, logs: [] });
        return true;
      }

      if (req.method === 'POST' && url.pathname === '/_lab/deployments/reset') {
        configs = defaultConfigs();
        discoveryLogs.length = 0;
        const childSnap = await computeSourceSnapshot(
          'weather-children',
          configs['weather-children'],
          true,
        );
        saveAndActivate('weather-children', childSnap, 'Reset to default');
        const portalSnap = await computeSourceSnapshot(
          'portal',
          configs.portal,
          true,
        );
        saveAndActivate('portal', portalSnap, 'Reset to default');
        json(serializeState());
        return true;
      }

      if (
        req.method === 'POST' &&
        url.pathname === '/_lab/deployments/publish'
      ) {
        const body = await readJsonBody(req);
        const source = body.source;
        if (!['portal', 'weather-children'].includes(source)) {
          json({ error: `Unknown deployment source "${source}".` }, 400);
          return true;
        }
        const nextConfig = body.config;
        if (!nextConfig || !Array.isArray(nextConfig.applications)) {
          json(
            { error: 'Invalid deployment config: missing applications.' },
            400,
          );
          return true;
        }

        // If Producer A's manifestUrl changed in portal, keep weather-children's
        // consumerManifestUrl aligned automatically unless user explicitly changed it.
        if (source === 'portal') {
          const weatherApp = nextConfig.applications.find(
            app => app.id === 'weather',
          );
          if (
            weatherApp?.manifestUrl &&
            configs['weather-children'].consumerManifestUrl !==
              weatherApp.manifestUrl
          ) {
            configs['weather-children'] = {
              ...configs['weather-children'],
              consumerManifestUrl: weatherApp.manifestUrl,
            };
            const syncedChild = await computeSourceSnapshot(
              'weather-children',
              configs['weather-children'],
              true,
            );
            saveAndActivate(
              'weather-children',
              syncedChild,
              `Synced consumer manifest to ${weatherApp.manifestUrl}`,
            );
          }
        }

        const snapshot = await computeSourceSnapshot(source, nextConfig, true);
        configs[source] = nextConfig;
        const summary =
          source === 'portal'
            ? `${snapshot.deliveryMode}${snapshot.pathClipped ? '+clipped' : ''} · ${snapshot.routes.length} routes`
            : `${snapshot.routes.length} child routes`;
        saveAndActivate(source, snapshot, summary);
        json(serializeState());
        return true;
      }

      if (
        req.method === 'GET' &&
        url.pathname === '/_lab/deployments/discover'
      ) {
        const source = url.searchParams.get('source') || 'portal';
        const pathname = url.searchParams.get('pathname') || '/';
        const basename = url.searchParams.get('basename') || '/';
        const deploymentId = url.searchParams.get('deploymentId') || undefined;
        const expectedSid = url.searchParams.get('expectedSid') || undefined;
        const env = url.searchParams.get('env') || 'browser';

        const active = getActiveSnapshot(source, deploymentId);
        if (!active) {
          const status = deploymentId ? 409 : 404;
          discoveryLogs.unshift({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            time: new Date().toISOString(),
            env,
            source,
            pathname,
            basename,
            status,
            error: deploymentId ? SNAPSHOT_EXPIRED_CODE : 'UNKNOWN_SOURCE',
          });
          json(
            {
              error: deploymentId
                ? `Pinned deployment "${source}@${deploymentId}" not found.`
                : `Unknown deployment source "${source}".`,
              ...(deploymentId ? { code: SNAPSHOT_EXPIRED_CODE } : {}),
            },
            status,
          );
          return true;
        }

        if (expectedSid && active.sid && expectedSid !== active.sid) {
          discoveryLogs.unshift({
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            time: new Date().toISOString(),
            env,
            source,
            pathname,
            basename,
            status: 409,
            deliveryMode: active.deliveryMode,
            pathClipped: active.pathClipped,
            expectedSid,
            sid: active.sid,
            error: SNAPSHOT_EXPIRED_CODE,
          });
          json(
            {
              error: `Deployment source "${source}" expired: expected "${expectedSid}", active is "${active.sid}".`,
              code: SNAPSHOT_EXPIRED_CODE,
              source,
              expectedSid,
              receivedSid: active.sid,
            },
            409,
          );
          return true;
        }

        const filtered = filterSnapshotForPath(active, pathname, basename);
        const payload = attachBundledChildren(filtered);

        discoveryLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toISOString(),
          env,
          source,
          pathname,
          basename,
          status: 200,
          sid: payload.sid,
          deliveryMode: payload.deliveryMode || 'layered',
          pathClipped: Boolean(payload.pathClipped),
          returnedRoutes: payload.routes.map(r => ({
            route: r.route,
            moduleName: r.moduleName,
            expose: r.expose,
            discoverChildren: r.discoverChildren,
          })),
          bundledChildren: Object.entries(payload.bundledChildren || {}).map(
            ([key, snap]) => ({
              key,
              consumer: snap.consumer,
              sid: snap.sid,
              routes: snap.routes.map(r => `${r.route} -> ${r.moduleName}`),
            }),
          ),
          fixedChildren: Object.entries(payload.fixedChildren || {}).map(
            ([key, snap]) => ({
              key,
              consumer: snap.consumer,
              sid: snap.sid,
              routes: snap.routes.map(r => `${r.route} -> ${r.moduleName}`),
            }),
          ),
          moduleInfoKeys: Object.keys(payload.moduleInfo || {}),
        });
        if (discoveryLogs.length > 100) discoveryLogs.length = 100;

        json(payload, 200);
        return true;
      }

      return false;
    } catch (error) {
      json(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        400,
      );
      return true;
    }
  }

  return {
    handleRequest,
    ensureInitialized,
    serializeState,
  };
}
