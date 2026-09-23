/**
 * ByteDance-internal vmok manifest loader.
 *
 * NOTE: This file contains code specific to ByteDance's internal vmok package
 * format. External users will never reach this code path — it is only invoked
 * when `manifestType: "vmok"` is set in the MCP Apps definition, which is not
 * applicable outside the ByteDance infrastructure.
 *
 * If you are an external contributor, you can safely ignore this file.
 * The standard Module Federation path lives in mf-loader.ts.
 */

import {
  fixProtocolRelativeUrl,
  initializeVMOK,
  loadAndInjectSnapshot,
} from './snapshot-loader.js';

export interface VmokSetupOptions {
  remoteEntry: string;
  snapshotUrl?: string;
  addLog: (msg: string) => void;
  snapshotCache: Map<string, unknown>;
}

/**
 * Perform vmok-specific pre-setup before creating the MF instance:
 * 1. Initialize the global `__VMOK__` runtime
 * 2. Fetch and inject the snapshot JSON (contains module chunk metadata)
 *
 * @returns The normalized remote entry URL (protocol-relative URLs are fixed)
 */
export async function setupVmokManifest({
  remoteEntry: rawRemoteEntry,
  snapshotUrl,
  addLog,
  snapshotCache,
}: VmokSetupOptions): Promise<string> {
  const remoteEntry = fixProtocolRelativeUrl(rawRemoteEntry);

  initializeVMOK();

  if (snapshotUrl) {
    await loadAndInjectSnapshot({ snapshotUrl, addLog, snapshotCache });
  }

  return remoteEntry;
}
