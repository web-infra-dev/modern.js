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
  const { generateSnapshotFromManifest } = enhancedRequire(
    '@module-federation/sdk',
  );

  const providerV1Url = `http://localhost:${ports.provider}/static/mf-manifest.json`;
  const providerV2Url = ports.providerV2
    ? `http://localhost:${ports.providerV2}/static/mf-manifest.json`
    : undefined;
  const nestedUrl = ports.nested
    ? `http://localhost:${ports.nested}/static/mf-manifest.json`
    : undefined;

  const producerRegistry = [
    {
      name: 'lab_provider',
      versions: [
        { version: 'v1', manifestUrl: providerV1Url },
        ...(providerV2Url
          ? [{ version: 'v2', manifestUrl: providerV2Url }]
          : []),
      ],
    },
    ...(nestedUrl
      ? [
          {
            name: 'lab_nested',
            versions: [{ version: 'v1', manifestUrl: nestedUrl }],
          },
        ]
      : []),
  ];

  const defaultConfigs = () => ({
    portal: {
      consumer: 'lab_dynamic_consumer',
      applications: [
        {
          id: 'air',
          title: 'Air Quality',
          enabled: true,
          route: 'air/*',
          sourceKind: 'registry', // 'registry' | 'url'
          producerName: 'lab_provider',
          version: 'v1',
          manifestUrl: providerV1Url,
          expose: './AirQualityApp',
          childrenMode: 'none',
          childrenDelivery: 'full', // only meaningful when route has nested children
          props: {},
        },
        {
          id: 'weather',
          title: 'Weather Portal',
          enabled: true,
          route: 'weather/*',
          sourceKind: 'registry',
          producerName: 'lab_provider',
          version: 'v1',
          manifestUrl: providerV1Url,
          expose: './WeatherApplication',
          childrenMode: 'dynamic',
          childrenSource: 'weather-children',
          childrenDelivery: 'full', // 'full' | 'layered'
          props: { label: 'Hangzhou · Dynamic Portal' },
        },
      ],
    },
    children: {
      'weather-children': {
        consumer: 'lab_provider',
        consumerManifestUrl: providerV1Url,
        applications: nestedUrl
          ? [
              {
                id: 'wind',
                title: 'Wind App',
                enabled: true,
                route: 'wind/*',
                sourceKind: 'registry',
                producerName: 'lab_nested',
                version: 'v1',
                manifestUrl: nestedUrl,
                expose: './WindApplication',
                childrenMode: 'none',
                props: { station: 'West Lake Ridge' },
              },
            ]
          : [],
      },
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

  const revisions = new Map(); // sourceName -> Map<deploymentId, snapshot>
  const activeIds = new Map(); // sourceName -> deploymentId
  const discoveryLogs = [];

  async function computeSourceSnapshot(
    sourceName,
    config,
    childrenConfigMap,
    forceManifestRefresh,
  ) {
    const sid = `${sourceName}-r${++seq}`;
    const routes = [];
    const moduleInfo = {};
    const sources = {};
    const childDeliveryByKey = {};
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

      const childSourceName = app.childrenSource;
      const childCfg =
        childSourceName && childrenConfigMap
          ? childrenConfigMap[childSourceName]
          : undefined;
      const hasEnabledChildren = Boolean(
        app.childrenMode === 'dynamic' &&
        childCfg?.applications?.some(child => child.enabled),
      );

      routes.push({
        route: cleanRoute,
        moduleName: manifest.name,
        expose: normalizedExpose,
        versionOrUrl: app.manifestUrl,
        discoverChildren: hasEnabledChildren,
        ...(app.props && Object.keys(app.props).length
          ? { props: { ...app.props } }
          : {}),
      });

      if (hasEnabledChildren && childSourceName) {
        const key = childSourceKey(
          manifest.name,
          normalizedExpose,
          app.manifestUrl,
        );
        sources[key] = {
          source: childSourceName,
          producerManifestUrl: app.manifestUrl,
          moduleName: manifest.name,
          expose: normalizedExpose,
          route: cleanRoute,
        };
        childDeliveryByKey[key] =
          app.childrenDelivery === 'layered' ? 'layered' : 'full';
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
      routes,
      moduleInfo,
      sources,
      childDeliveryByKey,
    };
  }

  function saveAndActivate(sourceName, snapshot) {
    let sourceRevs = revisions.get(sourceName);
    if (!sourceRevs) {
      sourceRevs = new Map();
      revisions.set(sourceName, sourceRevs);
    }
    sourceRevs.set(snapshot.sid, snapshot);
    activeIds.set(sourceName, snapshot.sid);
    return snapshot.sid;
  }

  async function ensureInitialized() {
    if (initialized) return;
    if (!initPromise) {
      initPromise = (async () => {
        for (const [childName, childCfg] of Object.entries(configs.children)) {
          const childSnap = await computeSourceSnapshot(
            childName,
            childCfg,
            undefined,
            false,
          );
          saveAndActivate(childName, childSnap);
        }
        const portalSnap = await computeSourceSnapshot(
          'portal',
          configs.portal,
          configs.children,
          false,
        );
        saveAndActivate('portal', portalSnap);
        initialized = true;
      })().catch(error => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  }

  function getActiveSnapshot(sourceName, deploymentId) {
    const id = deploymentId || activeIds.get(sourceName);
    if (!id) return undefined;
    return revisions.get(sourceName)?.get(id);
  }

  function computeEffectiveDelivery() {
    const portalSnap = getActiveSnapshot('portal');
    const childDeliveries = Object.values(portalSnap?.childDeliveryByKey || {});
    const hasLayeredChild = childDeliveries.includes('layered');
    return {
      mode: hasLayeredChild ? 'layered' : 'full',
      hasNestedChildren: childDeliveries.length > 0,
    };
  }

  function buildDeliveryPayload(snapshot) {
    const bundledChildren = {};
    let hasBundled = false;

    for (const [key, childRef] of Object.entries(snapshot.sources || {})) {
      const delivery = snapshot.childDeliveryByKey?.[key] || 'full';
      if (delivery !== 'full') continue;
      const childSnap = getActiveSnapshot(
        childRef.source,
        childRef.deploymentId,
      );
      if (childSnap) {
        bundledChildren[key] = JSON.parse(JSON.stringify(childSnap));
        hasBundled = true;
      }
    }

    const effective = computeEffectiveDelivery();

    return {
      version: 1,
      consumer: snapshot.consumer,
      ...(snapshot.consumerManifestUrl
        ? { consumerManifestUrl: snapshot.consumerManifestUrl }
        : {}),
      sid: snapshot.sid,
      deliveryMode: effective.mode,
      partialRoot: false,
      routes: snapshot.routes,
      moduleInfo: snapshot.moduleInfo,
      sources: snapshot.sources,
      ...(hasBundled ? { bundledChildren } : {}),
    };
  }

  function serializeState() {
    const portalActive = getActiveSnapshot('portal');
    const computed = computeEffectiveDelivery();
    const childrenState = {};
    for (const [name, cfg] of Object.entries(configs.children)) {
      const active = getActiveSnapshot(name);
      childrenState[name] = {
        config: cfg,
        active: active
          ? {
              sid: active.sid,
              routes: active.routes,
              moduleInfoKeys: Object.keys(active.moduleInfo || {}),
            }
          : null,
      };
    }
    return {
      computedDelivery: computed,
      registry: producerRegistry,
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
                sid: portalActive.sid,
                deliveryMode: computed.mode,
                routes: portalActive.routes,
                childDeliveryByKey: portalActive.childDeliveryByKey,
                moduleInfoKeys: Object.keys(portalActive.moduleInfo || {}),
              }
            : null,
        },
        children: childrenState,
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

      // Live manifest inspection for Entry URL & Version Registry pickers
      if (
        req.method === 'GET' &&
        url.pathname === '/_lab/deployments/inspect'
      ) {
        const manifestUrl = url.searchParams.get('manifestUrl') || '';
        if (!manifestUrl.trim()) {
          json({ error: 'manifestUrl is required' }, 400);
          return true;
        }
        const manifest = await loadManifest(manifestUrl.trim(), true);
        const exposes = (manifest.exposes || []).map(item => ({
          path: normalizeExpose(item.path || item.name || ''),
          name: item.name || item.path || '',
          render: item.render || 'component',
        }));
        json({
          manifestUrl: manifestUrl.trim(),
          name: manifest.name,
          buildVersion: manifest.metaData?.buildInfo?.buildVersion || '',
          exposes,
        });
        return true;
      }

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
        for (const [childName, childCfg] of Object.entries(configs.children)) {
          const childSnap = await computeSourceSnapshot(
            childName,
            childCfg,
            undefined,
            true,
          );
          saveAndActivate(childName, childSnap);
        }
        const portalSnap = await computeSourceSnapshot(
          'portal',
          configs.portal,
          configs.children,
          true,
        );
        saveAndActivate('portal', portalSnap);
        json(serializeState());
        return true;
      }

      if (
        req.method === 'POST' &&
        url.pathname === '/_lab/deployments/publish'
      ) {
        const body = await readJsonBody(req);

        // Publish portal + all child sources together
        if (body.portal) {
          const nextChildren = body.children || configs.children;
          for (const [childName, childCfg] of Object.entries(nextChildren)) {
            const parentApp = (body.portal.applications || []).find(
              app => app.childrenSource === childName,
            );
            const alignedCfg = {
              ...childCfg,
              ...(parentApp?.manifestUrl
                ? { consumerManifestUrl: parentApp.manifestUrl }
                : {}),
            };
            const prevCfg = configs.children[childName];
            if (
              !prevCfg ||
              JSON.stringify(alignedCfg) !== JSON.stringify(prevCfg)
            ) {
              const childSnap = await computeSourceSnapshot(
                childName,
                alignedCfg,
                undefined,
                true,
              );
              configs.children[childName] = alignedCfg;
              saveAndActivate(childName, childSnap);
            }
          }
          const portalSnap = await computeSourceSnapshot(
            'portal',
            body.portal,
            configs.children,
            true,
          );
          configs.portal = body.portal;
          saveAndActivate('portal', portalSnap);
          json(serializeState());
          return true;
        }

        // Independent single child source publish
        if (body.source && body.config && body.source !== 'portal') {
          const childSnap = await computeSourceSnapshot(
            body.source,
            body.config,
            undefined,
            true,
          );
          configs.children[body.source] = body.config;
          saveAndActivate(body.source, childSnap);
          json(serializeState());
          return true;
        }

        json({ error: 'Invalid publish payload.' }, 400);
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
          json(
            {
              error: `Unknown deployment source "${source}".`,
              ...(deploymentId ? { code: SNAPSHOT_EXPIRED_CODE } : {}),
            },
            status,
          );
          return true;
        }

        if (expectedSid && active.sid && expectedSid !== active.sid) {
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

        const payload = buildDeliveryPayload(active);
        discoveryLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toISOString(),
          env,
          source,
          pathname,
          basename,
          status: 200,
          sid: payload.sid,
          deliveryMode: payload.deliveryMode,
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
