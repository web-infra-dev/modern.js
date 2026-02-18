import fs from 'fs-extra';
import { LRUCache } from 'lru-cache';

export interface FileResult {
  content: string;
  lastModified: number;
}

export class FileCache {
  private cache = new LRUCache<string, FileResult>({
    maxSize: 200 * 1024 * 1024, // 200MB
  });

  /**
   * Check if file exists and return file info
   * @param filepath Path to the file
   * @returns FileResult or null if file doesn't exist
   */
  async getFile(filepath: string): Promise<FileResult | null> {
    // Check if file exists
    if (!(await fs.pathExists(filepath))) {
      return null;
    }

    try {
      const stat = await fs.lstat(filepath);
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
      const content = await fs.readFile(filepath, 'utf-8');
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
