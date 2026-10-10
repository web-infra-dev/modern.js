import { mcpServer } from '@modern-js/plugin-mcp-apps/bff';
import definition from '../mcp_apps';

export const { POST, GET, DELETE, PUT, PATCH, OPTIONS } = mcpServer(definition);
