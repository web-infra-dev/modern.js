import { resolve } from 'node:path';
import { checkPackageArtifacts } from './packageArtifacts';

async function main() {
  const workspaceRoot = resolve(__dirname, '../../..');
  const result = await checkPackageArtifacts(
    workspaceRoot,
    process.argv.slice(2),
  );
  for (const diagnostic of result.diagnostics) {
    console.error(
      `${diagnostic.packageName} ${diagnostic.path}:${diagnostic.line} [${diagnostic.rule}] ${diagnostic.message}`,
    );
  }
  if (result.diagnostics.length > 0) {
    process.exitCode = 1;
  } else {
    console.log(
      `Checked packed artifacts for ${result.packages} publishable packages.`,
    );
  }
}

main().catch(error => {
  console.error(
    `[artifact-pack] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
