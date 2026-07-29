/** What happened to a file during {@link applyAgentFiles}. */
export type AgentFileOutcome =
  | 'created'
  | 'updated'
  | 'added'
  | 'linked'
  | 'unchanged';

export interface ApplyAgentFilesOptions {
  /** Project root to write into. */
  targetDir: string;
  /** The managed block, markers included. */
  block: string;
  /** Marker name used inside `block`, e.g. `modernjs-agent-rules`. */
  markerName: string;
}

export interface ApplyAgentFilesResult {
  agents: AgentFileOutcome;
  claude: AgentFileOutcome;
}

/**
 * Extracts the managed block from a template file, so a scaffolder and a
 * codemod can share one source of truth for the block's content.
 */
export function readManagedBlock(
  templateFile: string,
  markerName: string,
): string;

/** Idempotently writes AGENTS.md and CLAUDE.md into `targetDir`. */
export function applyAgentFiles(
  options: ApplyAgentFilesOptions,
): ApplyAgentFilesResult;
