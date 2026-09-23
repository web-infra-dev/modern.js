export interface ToolData {
  tool: string;
  config: {
    name?: string;
    title?: string;
    description?: string;
    resource?: unknown;
  };
  args: Record<string, unknown>;
}
