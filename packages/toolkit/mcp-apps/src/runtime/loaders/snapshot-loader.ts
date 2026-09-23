interface SnapshotLoaderOptions {
  snapshotUrl: string;
  addLog: (msg: string) => void;
  snapshotCache: Map<string, unknown>;
}

type VmokGlobal = {
  __VMOK__?: {
    moduleInfo?: unknown;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ByteDance-internal: vmok manifest format
//
// vmok is a ByteDance-internal extension of Module Federation that adds a
// snapshot mechanism (vmok-snapshot.json) for dependency resolution and CDN
// path derivation via getPublicPath function strings.
//
// External users should use manifestType: 'mf' (the default), which works
// with standard mf-manifest.json produced by any Module Federation build.
// The vmok path below is only used by ByteDance-internal MCP Apps definitions.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the __VMOK__ global object (ByteDance-internal, vmok mode only)
 */
export function initializeVMOK() {
  const vmokWindow = window as Window & VmokGlobal;
  if (!vmokWindow.__VMOK__) {
    vmokWindow.__VMOK__ = { moduleInfo: {} };
  } else if (!vmokWindow.__VMOK__.moduleInfo) {
    vmokWindow.__VMOK__.moduleInfo = {};
  }
}

/**
 * Load and inject a snapshot into the global __VMOK__ object.
 * Supports caching to avoid repeated fetches.
 */
export async function loadAndInjectSnapshot({
  snapshotUrl,
  addLog,
  snapshotCache,
}: SnapshotLoaderOptions): Promise<void> {
  if (!snapshotUrl) {
    return;
  }

  // Check cache
  if (snapshotCache.has(snapshotUrl)) {
    const vmokWindow = window as Window & VmokGlobal;
    if (vmokWindow.__VMOK__) {
      vmokWindow.__VMOK__.moduleInfo = snapshotCache.get(snapshotUrl);
    }
    addLog(`✅ Using cached snapshot`);
    return;
  }

  try {
    addLog(`🚀 Loading snapshot...`);

    // Fetch directly; the origin must be in CSP connectDomains
    const response = await fetch(snapshotUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const snapshotData = await response.json();

    // Fix protocol-relative URLs (// prefix)
    const fixedData = fixProtocolRelativeUrls(snapshotData);
    const snapshotText = JSON.stringify(fixedData);

    addLog(`✅ Snapshot loaded (${Math.round(snapshotText.length / 1024)}KB)`);

    // Cache and inject into window.__VMOK__
    snapshotCache.set(snapshotUrl, fixedData);
    const vmokWindow = window as Window & VmokGlobal;
    if (vmokWindow.__VMOK__) {
      vmokWindow.__VMOK__.moduleInfo = fixedData;
    }

    addLog(`✅ Snapshot cached and injected`);

    // Validate
    validateSnapshot(fixedData, addLog);
  } catch (snapshotErr: unknown) {
    const message =
      snapshotErr instanceof Error ? snapshotErr.message : String(snapshotErr);
    addLog(`❌ Snapshot load failed: ${message}`);
    console.error('[Snapshot Loader] Error:', snapshotErr);
    throw snapshotErr;
  }
}

/**
 * Recursively fix protocol-relative URLs (// prefix → https://).
 * Special-cases `getPublicPath` values which are JS function strings.
 */
function fixProtocolRelativeUrls(obj: unknown, key?: string): unknown {
  if (typeof obj === 'string') {
    if (obj.startsWith('//')) {
      return `https:${obj}`;
    }
    // getPublicPath values are JS function strings; replace // URLs inside them
    if (key === 'getPublicPath' && obj.includes('//')) {
      return obj.replace(/(['"`])\/\//g, '$1https://');
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => fixProtocolRelativeUrls(item));
  }
  if (obj && typeof obj === 'object') {
    const fixed: Record<string, unknown> = {};
    for (const [k, value] of Object.entries(obj)) {
      fixed[k] = fixProtocolRelativeUrls(value, k);
    }
    return fixed;
  }
  return obj;
}

/**
 * Validate snapshot data and log warnings for any remaining issues.
 */
function validateSnapshot(
  snapshotData: unknown,
  addLog: (msg: string) => void,
) {
  // Check for any remaining protocol-relative URLs
  const jsonStr = JSON.stringify(snapshotData);
  const hasProtocolRelative =
    jsonStr.includes('"//"') || jsonStr.includes("'//");

  if (hasProtocolRelative) {
    addLog(`⚠️ Warning: snapshot still contains protocol-relative URLs`);
  } else {
    addLog(`✅ Snapshot URL validation passed`);
  }

  // Log __VMOK__ data key count for observability
  const vmokWindow = window as Window & VmokGlobal;
  const moduleInfo = vmokWindow.__VMOK__?.moduleInfo;
  const vmokKeys =
    moduleInfo && typeof moduleInfo === 'object' ? Object.keys(moduleInfo) : [];
  addLog(`📦 __VMOK__ keys: ${vmokKeys.slice(0, 5).join(', ')}...`);
}

/**
 * Fix a single protocol-relative URL (// prefix → https://).
 */
export function fixProtocolRelativeUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
