import { Environment, ConfigValueType } from '@/models/SystemConfig';
import EventEmitter from 'events';

/**
 * Configuration cache with hot reload support
 * Issue #61: System Configuration Management
 */

interface CacheEntry {
  value: ConfigValueType;
  timestamp: number;
  environment: Environment;
  version?: number;
}

class ConfigCache extends EventEmitter {
  private cache: Map<string, CacheEntry>;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(ttl: number = 300000) {
    // 5 minutes default TTL
    super();
    this.cache = new Map();
    this.ttl = ttl;
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Get cached configuration value
   */
  get(key: string, environment: Environment): ConfigValueType | undefined {
    const cacheKey = this.getCacheKey(key, environment);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return undefined;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set cached configuration value
   */
  set(key: string, value: ConfigValueType, environment: Environment, version?: number): void {
    const cacheKey = this.getCacheKey(key, environment);
    const oldEntry = this.cache.get(cacheKey);

    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      environment,
      version,
    };

    this.cache.set(cacheKey, entry);

    // Emit change event for hot reload
    if (!oldEntry || JSON.stringify(oldEntry.value) !== JSON.stringify(value)) {
      this.emit('configChanged', {
        key,
        value,
        environment,
        previousValue: oldEntry?.value,
        version,
      });
    }
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string, environment: Environment): void {
    const cacheKey = this.getCacheKey(key, environment);
    const entry = this.cache.get(cacheKey);

    if (entry) {
      this.cache.delete(cacheKey);
      this.emit('configCleared', {
        key,
        environment,
        value: entry.value,
      });
    }
  }

  /**
   * Clear all cache entries for an environment
   */
  clearEnvironment(environment: Environment): void {
    const keysToDelete: string[] = [];

    for (const [cacheKey, entry] of this.cache.entries()) {
      if (entry.environment === environment) {
        keysToDelete.push(cacheKey);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    this.emit('environmentCleared', { environment, count: keysToDelete.length });
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cacheCleared', { count: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    environments: Record<Environment, number>;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const environments: Record<Environment, number> = {
      development: 0,
      staging: 0,
      production: 0,
    };

    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const entry of this.cache.values()) {
      environments[entry.environment]++;

      if (!oldestTimestamp || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }

      if (!newestTimestamp || entry.timestamp > newestTimestamp) {
        newestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      environments,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp,
    };
  }

  /**
   * Check if a cache entry exists
   */
  has(key: string, environment: Environment): boolean {
    const cacheKey = this.getCacheKey(key, environment);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Get all cached keys for an environment
   */
  getKeys(environment?: Environment): string[] {
    const keys: string[] = [];

    for (const [cacheKey, entry] of this.cache.entries()) {
      if (!environment || entry.environment === environment) {
        if (!this.isExpired(entry)) {
          const [, key] = cacheKey.split(':');
          keys.push(key);
        }
      }
    }

    return [...new Set(keys)]; // Remove duplicates
  }

  /**
   * Update TTL
   */
  setTTL(ttl: number): void {
    this.ttl = ttl;
    this.restartCleanup();
  }

  /**
   * Warm up cache with preloaded values
   */
  warmUp(
    configs: Array<{
      key: string;
      value: ConfigValueType;
      environment: Environment;
      version?: number;
    }>
  ): void {
    for (const config of configs) {
      this.set(config.key, config.value, config.environment, config.version);
    }

    this.emit('cacheWarmedUp', { count: configs.length });
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(
    key: string,
    environment: Environment,
    callback: (value: ConfigValueType, previousValue?: ConfigValueType) => void
  ): () => void {
    const listener = (data: any) => {
      if (data.key === key && data.environment === environment) {
        callback(data.value, data.previousValue);
      }
    };

    this.on('configChanged', listener);

    // Return unsubscribe function
    return () => {
      this.off('configChanged', listener);
    };
  }

  /**
   * Private methods
   */
  private getCacheKey(key: string, environment: Environment): string {
    return `${environment}:${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private restartCleanup(): void {
    this.startCleanup();
  }

  private cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      this.emit('cacheCleanup', { removed: keysToDelete.length });
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.cache.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const configCache = new ConfigCache();

// Export for testing
export { ConfigCache };

// Global configuration reload emitter for browser/server environments
declare global {
  var configReloadEmitter: EventEmitter | undefined;
}

if (typeof global !== 'undefined' && !global.configReloadEmitter) {
  global.configReloadEmitter = new EventEmitter();
}
