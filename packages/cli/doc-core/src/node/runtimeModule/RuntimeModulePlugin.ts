// A simple version for the virtual module generation
// It is sincerely defferent from `webpack-virtual-modules`
import path from 'path';
import fs from 'fs-extra';

export default class RuntimeModulesPlugin {
  staticModules: Record<string, string>;

  constructor(staticModules: Record<string, string>) {
    this.staticModules = staticModules;
  }

  apply() {
    // Write the modules to the disk
    Object.entries(this.staticModules).forEach(([path, content]) => {
      fs.writeFileSync(this.#normalizePath(path), content);
    });
  }

  writeModule(path: string, content: string) {
    const normalizedPath = this.#normalizePath(path);
    this.staticModules[normalizedPath] = content;
    fs.writeFileSync(normalizedPath, content);
  }

  #normalizePath(p: string) {
    if (path.isAbsolute(p)) {
      return p;
    } else {
      return path.join(process.cwd(), p);
    }
  }
}
