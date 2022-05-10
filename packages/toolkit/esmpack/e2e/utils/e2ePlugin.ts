import { fs, semver } from '@modern-js/utils';
import {
  CachedInputFileSystem,
  Resolver,
  ResolverFactory,
} from 'enhanced-resolve';
import type { EsmpackPlugin } from '../../src/Options';
import type { Compiler } from '../../src/Compiler';
import {
  preparePackage,
  preparePackages,
  getPackageMeta,
} from '../../__tests__/npm';
import { normalizePackageName } from '../../src/utils/package';

type PackagesInfo = Record<string, string>;

const pluginName = 'E2EPlugin';

class E2EPlguin implements EsmpackPlugin {
  public workDir: string;

  private readonly initP: Promise<any>;

  private readonly pendingTasks: Set<string>;

  private readonly finishTasks: Set<string>;

  private readonly resolver: Resolver;

  constructor(workDir: string, packages: PackagesInfo) {
    this.workDir = workDir;
    this.pendingTasks = new Set(
      Object.entries(packages).map(([k, v]) => hash(k, v)),
    );
    this.finishTasks = new Set();
    this.initP = preparePackages(workDir, packages);
    /**
     * installPackages has issues, since i don't store importer to hash, which leads to incorrect manifest version
     */
    // this.initP = installPackages(workDir, packages);
    this.resolver = ResolverFactory.createResolver({
      fileSystem: new CachedInputFileSystem(fs, 4000),
      conditionNames: ['import', 'module', 'development', 'browser'],
      aliasFields: ['browser'],
      mainFields: ['browser', 'module', 'main'],
      modules: ['node_modules'],
      mainFiles: ['index'],
      extensions: ['.js', '.json'],
      exportsFields: ['exports'],
    });
  }

  apply(compiler: Compiler) {
    compiler.hooks.initialize.tapPromise(pluginName, async _compiler => {
      await this.initP;
    });

    compiler.hooks.afterCompile.tapPromise(pluginName, async compilation => {
      const spec = compilation.specifier;
      if (!compilation.manifest?.version) {
        throw new Error(`Missing manifest.version at ${spec}`);
      }
      const h = hash(spec, compilation.manifest.version);
      // tempLog(`finish ${h}`);
      this.finishTasks.add(h);

      const uniqDepSpec = new Set<string>(
        compilation.dependencies.map(d => d.specifier),
      );

      const importerPackageName = normalizePackageName(spec);
      const importer = compilation.inputOptions.input![spec];
      const resolve = async (id: string, importer: string) =>
        new Promise<string | undefined>((resolve, reject) =>
          this.resolver.resolve({}, importer, id, {}, (err, filePath) => {
            if (err) {
              return reject(err);
            }
            return resolve(filePath || undefined);
          }),
        );
      const uniqPackageName = new Set(
        Array.from(uniqDepSpec).map(d => normalizePackageName(d)),
      );
      const name2Version: Record<string, string> = {};
      for (const depName of uniqPackageName) {
        if (depName !== importerPackageName && !name2Version[depName]) {
          try {
            const pkgJsonPath = await resolve(
              `${depName}/package.json`,
              importer,
            );
            const { version: depVersion } = JSON.parse(
              fs.readFileSync(pkgJsonPath!).toString(),
            );
            name2Version[depName] = depVersion;
          } catch (e) {
            const { version: depVersion } =
              await extractPackageInfoFromSpecifier(
                depName,
                importerPackageName,
                this.workDir,
              );
            name2Version[depName] = depVersion;
          }
        } else {
          // self dependency
          name2Version[depName] = compilation.manifest.version;
        }
      }

      for (const depSpec of uniqDepSpec) {
        const depName = normalizePackageName(depSpec);
        const depVersion = name2Version[depName];
        const other = hash(depSpec, depVersion);
        if (!this.finishTasks.has(other) && !this.pendingTasks.has(other)) {
          this.pendingTasks.add(other);
          const depName = normalizePackageName(depSpec);
          try {
            const dir = require.resolve(`${depName}/package.json`, {
              paths: [this.workDir],
            });
            if (!dir.includes(this.workDir)) {
              throw new Error('');
            }
          } catch (e) {
            // debugger;
            // throw e;
            await preparePackage(this.workDir, depName, depVersion);
          }
        }
      }
      // tempLog(`finish2 ${h}`);
      this.pendingTasks.delete(h);
      // tempLog(Array.from(this.pendingTasks).join(', '));

      while (this.pendingTasks.size) {
        for (const task of this.pendingTasks) {
          const [_spec] = extract(task);
          // tempLog(`> compile ${spec} from ${importer}`);
          await compiler.run({
            specifier: _spec,
            importer,
          });
        }
      }
    });
  }
}

export { E2EPlguin };

function hash(spec: string, version: string) {
  return `${spec}___${version}`;
}
function extract(_hash: string) {
  return _hash.split('___');
}

async function extractPackageInfoFromSpecifier(
  specifier: string,
  importerPkgName: string,
  cwd: string,
) {
  const jsonPath = require.resolve(`${importerPkgName}/package.json`, {
    paths: [cwd],
  });
  const manifest = JSON.parse(fs.readFileSync(jsonPath).toString());

  const name = normalizePackageName(specifier);
  let versionRange =
    manifest.dependencies?.[name] ||
    manifest.devDependencies?.[name] ||
    manifest.peerDependencies?.[name];
  if (!versionRange) {
    throw new Error(`${importerPkgName} implicitly depends on ${name}`);
  }
  const metadata = await getPackageMeta(name);
  const allVersions = Object.keys(metadata.versions);
  if (versionRange === 'latest') {
    versionRange = '*';
  }
  const matchedVersion = semver.maxSatisfying(allVersions, versionRange);
  if (!matchedVersion) {
    throw new Error(`${specifier}: ${versionRange} from ${importerPkgName}`);
  }
  return {
    name,
    version: matchedVersion,
  };
}
