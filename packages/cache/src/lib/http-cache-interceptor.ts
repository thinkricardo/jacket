import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { Observable, of, tap } from 'rxjs';

import { CACHE_OPTIONS_TOKEN, CacheOptions } from './cache-options';

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<unknown>>();
  private expirationCache = new Map<string, number>();

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    const options = request.context.get(CACHE_OPTIONS_TOKEN);
    const key = options.key ?? request.url;

    const cacheResponse = this.get(key, options);
    if (cacheResponse) {
      return of(cacheResponse);
    }

    return next.handle(request).pipe(
      tap((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          this.save(key, event, options);
        }
      })
    );
  }

  hasExpired(key: string): boolean {
    if (!this.expirationCache.has(key)) {
      return false;
    }

    const expiration = this.expirationCache.get(key);

    if (expiration && expiration < Date.now()) {
      return true;
    }

    return false;
  }

  exists(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.expirationCache.delete(key);
  }

  get(key: string, options: CacheOptions): HttpResponse<unknown> | undefined {
    if (!options.isEnabled && this.exists(key)) {
      this.delete(key);
      return;
    }

    if (this.hasExpired(key)) {
      this.delete(key);
      return;
    }

    return this.cache.get(key);
  }

  save(key: string, value: HttpResponse<unknown>, options: CacheOptions): void {
    if (!options.isEnabled) return;

    if (options.ttl) {
      this.expirationCache.set(key, Date.now() + options.ttl);
    }

    this.cache.set(key, value);
  }
}
