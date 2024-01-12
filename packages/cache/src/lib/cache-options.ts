import { HttpContext, HttpContextToken } from '@angular/common/http';

export interface CacheOptions {
  isEnabled: boolean;
  key?: string;
  ttl?: number;
}

const defaultOptions: CacheOptions = {
  isEnabled: false,
};

export const CACHE_OPTIONS_TOKEN = new HttpContextToken<CacheOptions>(() => defaultOptions);

export function withCache(options: CacheOptions) {
  return new HttpContext().set(CACHE_OPTIONS_TOKEN, options);
}
