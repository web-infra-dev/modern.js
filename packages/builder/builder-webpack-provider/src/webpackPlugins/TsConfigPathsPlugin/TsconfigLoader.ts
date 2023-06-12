/**
 * The following code is modified based on
 * https://github.com/wre232114/enhanced-tsconfig-paths-webpack-plugin/
 *
 * MIT Licensed
 * Author wre232114
 * Copyright (c) 2021 wre232114
 * https://github.com/wre232114/enhanced-tsconfig-paths-webpack-plugin/blob/main/LICENSE
 */
import fs from 'fs';
import path from 'path';

import {
  loadConfig,
  type ConfigLoaderSuccessResult,
} from '@modern-js/utils/tsconfig-paths';

/**
 * Load the clostest tsconfig.json
 */
export class TsconfigLoader {
  readonly TSCONFIG_FILE: string = 'tsconfig.json';

  /**
   * cache visited dir and tsconfig infos
   */
  readonly #visitedDirMap: Map<string, boolean> = new Map<string, boolean>();

  /**
   * load closest tsconfig.json
   * @param cwd the dir path to load closest tsconfig.json
   */
  load(cwd: string): ConfigLoaderSuccessResult | null {
    const tsconfigPath = this._getClosestTsconfigDirPath(cwd);

    if (!tsconfigPath) {
      return null;
    }

    const tsconfig = loadConfig(tsconfigPath);

    if (tsconfig.resultType === 'success') {
      return tsconfig;
    } else {
      return null;
    }
  }

  private _getClosestTsconfigDirPath(cwd: string): string {
    const tempDir = cwd;

    /**
     * return when reach root
     */
    if (path.dirname(tempDir) === tempDir) {
      return '';
    }

    if (this.#visitedDirMap.get(tempDir) === true) {
      return tempDir;
    }

    const tsconfigPath = path.join(tempDir, this.TSCONFIG_FILE);

    if (fs.existsSync(tsconfigPath)) {
      this.#visitedDirMap.set(tempDir, true);
      return tempDir;
    }

    this.#visitedDirMap.set(tempDir, false);
    return this._getClosestTsconfigDirPath(path.dirname(tempDir));
  }
}
