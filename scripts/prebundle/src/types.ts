export type ImportMap = {
  path: string;
  content: string;
};

export type DependencyConfig = {
  /** Name of dependency */
  name: string;
  /** Whether to minify the code. */
  minify?: boolean;
  /** External some sub-dependencies. */
  externals?: Record<string, string>;
  /** Extra entry files to map imports */
  emitFiles?: ImportMap[];
  /** Copy fields from original package.json to target package.json. */
  packageJsonField?: string[];
  /* Callback before bundle */
  beforeBundle?: (task: ParsedTask) => void | Promise<void>;
};

export type TaskConfig = {
  packageDir: string;
  packageName: string;
  dependencies: Array<string | DependencyConfig>;
};

export type ParsedTask = {
  depPath: string;
  depEntry: string;
  distPath: string;
  importPath: string;
  packageDir: string;
  packagePath: string;
  packageName: string;
  minify: NonNullable<DependencyConfig['minify']>;
  depName: NonNullable<DependencyConfig['name']>;
  externals: NonNullable<DependencyConfig['externals']>;
  emitFiles: NonNullable<DependencyConfig['emitFiles']>;
  beforeBundle?: NonNullable<DependencyConfig['beforeBundle']>;
  packageJsonField: NonNullable<DependencyConfig['packageJsonField']>;
};
