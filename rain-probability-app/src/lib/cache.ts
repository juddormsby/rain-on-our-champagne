import { CACHE_TTL_DAYS } from './config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ApiCache {
  private prefix = 'rain-app-cache:';

  private createKey(url: string): string {
    return `${this.prefix}${url}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  async get<T>(url: string): Promise<T | null> {
    try {
      const key = this.createKey(url);
      const cached = sessionStorage.getItem(key);
      
      if (!cached) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cached);
      
      if (this.isExpired(entry)) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set<T>(url: string, data: T, ttlDays = CACHE_TTL_DAYS): Promise<void> {
    try {
      const key = this.createKey(url);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlDays * 24 * 60 * 60 * 1000, // Convert days to milliseconds
      };
      
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set error:', error);
      // Storage might be full - try to clear some old entries
      this.cleanup();
    }
  }

  cleanup(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key?.startsWith(this.prefix)) continue;
        
        try {
          const cached = sessionStorage.getItem(key);
          if (!cached) continue;
          
          const entry: CacheEntry<any> = JSON.parse(cached);
          if (this.isExpired(entry)) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid entry, remove it
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export const apiCache = new ApiCache();

// Cached fetch wrapper
export async function cachedFetch(url: string, options?: RequestInit): Promise<Response> {
  // Only cache GET requests
  if (options?.method && options.method !== 'GET') {
    return fetch(url, options);
  }
  
  // Check cache first
  const cached = await apiCache.get<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
  }>(url);
  
  if (cached) {
    // Return cached response
    return new Response(JSON.stringify(cached.body), {
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers,
    });
  }
  
  // Fetch from network
  const response = await fetch(url, options);
  
  // Cache successful responses
  if (response.ok) {
    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();
      const headers: Record<string, string> = {};
      
      clonedResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      await apiCache.set(url, {
        status: response.status,
        statusText: response.statusText,
        headers,
        body,
      });
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }
  
  return response;
} 