/**
 * The following code is modified based on
 * https://github.com/microsoft/rushstack/blob/main/libraries/node-core-library/src/IPackageJson.ts
 *
 * MIT Licensed
 * Copyright (c) Microsoft Corporation
 * https://github.com/microsoft/rushstack/blob/main/LICENSE
 */

/**
 * This interface is part of the {@link IPackageJson} file format.  It is used for the
 * "dependencies", "optionalDependencies", and "devDependencies" fields.
 * @public
 */
export interface IPackageJsonDependencyTable {
  /**
   * The key is the name of a dependency.  The value is a Semantic Versioning (SemVer)
   * range specifier.
   */
  [dependencyName: string]: string;
}

export interface IPackageJsonRepository {
  /**
   * The source control type for the repository that hosts the project. This is typically "git".
   */
  type: string;

  /**
   * The URL of the repository that hosts the project.
   */
  url: string;

  /**
   * If the project does not exist at the root of the repository, its path is specified here.
   */
  directory?: string;
}

/**
 * This interface is part of the {@link IPackageJson} file format.  It is used for the
 * "scripts" field.
 * @public
 */
export interface IPackageJsonScriptTable {
  /**
   * The key is the name of the script hook.  The value is the script body which may
   * be a file path or shell script command.
   */
  [scriptName: string]: string;
}

/**
 * This interface is part of the {@link IPackageJson} file format. It is used for the
 * "peerDependenciesMeta" field.
 * @public
 */
export interface IPeerDependenciesMetaTable {
  [dependencyName: string]: {
    optional?: boolean;
  };
}

export type ExportsModuleRules =
  | string
  | Record<string, string>
  | Record<string, string | Record<string, string>>;

export interface ExportsConfig {
  [modulePath: string]: ExportsModuleRules;
}

export interface INodePackageJson {
  /**
   * The name of the package.
   */
  name: string;

  /**
   * A version number conforming to the Semantic Versioning (SemVer) standard.
   */
  version?: string;

  /**
   * Indicates whether this package is allowed to be published or not.
   */
  private?: boolean;

  /**
   * A brief description of the package.
   */
  description?: string;

  /**
   * The URL of the project's repository.
   */
  repository?: string | IPackageJsonRepository;

  /**
   * The URL to the project's web page.
   */
  homepage?: string;

  /**
   * The name of the license.
   */
  license?: string;

  /**
   * The path to the module file that will act as the main entry point.
   */
  main?: string;

  exports?: ExportsConfig;

  /**
   * The path to the TypeScript *.d.ts file describing the module file
   * that will act as the main entry point.
   */
  types?: string;

  /**
   * Alias for `types`
   */
  typings?: string;

  /**
   * The path to the TSDoc metadata file.
   * This is still being standardized: https://github.com/microsoft/tsdoc/issues/7#issuecomment-442271815
   * @beta
   */
  tsdocMetadata?: string;

  /**
   * The main entry point for the package.
   */
  bin?: string;

  /**
   * An array of dependencies that must always be installed for this package.
   */
  dependencies?: IPackageJsonDependencyTable;

  /**
   * An array of optional dependencies that may be installed for this package.
   */
  optionalDependencies?: IPackageJsonDependencyTable;

  /**
   * An array of dependencies that must only be installed for developers who will
   * build this package.
   */
  devDependencies?: IPackageJsonDependencyTable;

  /**
   * An array of dependencies that must be installed by a consumer of this package,
   * but which will not be automatically installed by this package.
   */
  peerDependencies?: IPackageJsonDependencyTable;

  /**
   * An array of metadata about peer dependencies.
   */
  peerDependenciesMeta?: IPeerDependenciesMetaTable;

  /**
   * A table of script hooks that a package manager or build tool may invoke.
   */
  scripts?: IPackageJsonScriptTable;

  /**
   * A table of package version resolutions. This feature is only implemented by the Yarn package manager.
   *
   * @remarks
   * See the {@link https://github.com/yarnpkg/rfcs/blob/master/implemented/0000-selective-versions-resolutions.md
   * | 0000-selective-versions-resolutions.md RFC} for details.
   */
  resolutions?: Record<string, string>;
}

export interface IPackageJson extends INodePackageJson {
  // Make the "version" field non-optional.
  /** {@inheritDoc INodePackageJson.version} */
  version: string;
}
