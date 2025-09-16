import { createDebugger } from '@modern-js/utils';

export const debug = createDebugger('server');

export enum ResourceType {
  Builder = 'builder',
  Watcher = 'watcher',
}

export class ResourceManager {
  private resources: Record<ResourceType, (() => Promise<void>) | null> = {
    [ResourceType.Builder]: null,
    [ResourceType.Watcher]: null,
  };

  register(type: ResourceType, cb: () => Promise<void>) {
    this.resources[type] = cb;
  }

  async close(type: ResourceType) {
    await this.resources[type]?.();
    this.resources[type] = null;
  }

  async closeAll() {
    await Promise.allSettled([
      this.resources[ResourceType.Builder]?.() || Promise.resolve(),
      this.resources[ResourceType.Watcher]?.() || Promise.resolve(),
    ]);
    this.resources[ResourceType.Builder] = null;
    this.resources[ResourceType.Watcher] = null;
  }
}
