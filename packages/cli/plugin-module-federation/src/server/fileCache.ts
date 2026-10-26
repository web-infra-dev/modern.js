import { access, lstat, readFile } from 'fs/promises';
import { SizeLimitedCache } from '@module-federation/bridge-react/size-limited-cache';

const pathExists = async (filepath: string): Promise<boolean> => {
  try {
    await access(filepath);
    return true;
  } catch {
    return false;
  }
};

export interface FileResult {
  content: string;
  lastModified: number;
}

export class FileCache {
  private cache: SizeLimitedCache<string, FileResult>;

  constructor(maxSize = 200 * 1024 * 1024) {
    this.cache = new SizeLimitedCache({ maxSize });
  }

  /**
   * Check if file exists and return file info
   * @param filepath Path to the file
   * @returns FileResult or null if file doesn't exist
   */
  async getFile(filepath: string): Promise<FileResult | null> {
    // Check if file exists
    if (!(await pathExists(filepath))) {
      return null;
    }

    try {
      const stat = await lstat(filepath);
      const currentModified = stat.mtimeMs;

      // Check if file is in cache and if the cached version is still valid
      const cachedEntry = this.cache.get(filepath);
      if (cachedEntry && currentModified <= cachedEntry.lastModified) {
        return {
          content: cachedEntry.content,
          lastModified: cachedEntry.lastModified,
        };
      }

      // Read file and update cache
      const content = await readFile(filepath, 'utf-8');
      const newEntry: FileResult = {
        content,
        lastModified: currentModified,
      };

      this.cache.set(filepath, newEntry, {
        size: stat.size || content.length,
      });

      return {
        content,
        lastModified: currentModified,
      };
    } catch (err) {
      return null;
    }
  }
}

// Export singleton instance
export const fileCache = new FileCache();
