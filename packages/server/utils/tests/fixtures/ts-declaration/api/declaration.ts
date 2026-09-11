// Top-level `import type` → ImportDeclaration specifier in the emitted d.ts.
import type { SharedUser } from '@shared/types';
// `import x = require(...)` → ImportEqualsDeclaration specifier.
import shared = require('@shared/types');

export type ReExportedUser = SharedUser;

// Re-export declaration whose module specifier is an alias.
export type { SharedResult } from '@shared/types';

// Inline `import("...")` type → ImportTypeNode specifier.
export declare function getUser(): import('@shared/types').SharedUser;

export const sharedNamespace = shared;
