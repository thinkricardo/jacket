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

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    const options = request.context.get(CACHE_OPTIONS_TOKEN);

    const cacheResponse = this.get(request.url, options);
    if (cacheResponse) {
      return of(cacheResponse);
    }

    return next.handle(request).pipe(
      tap((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          this.save(request.url, event, options);
        }
      })
    );
  }

  get(key: string, options: CacheOptions): HttpResponse<unknown> | undefined {
    const cacheResponse = this.cache.get(key);

    if (!options.isEnabled && cacheResponse) {
      this.cache.delete(key);
      return;
    }

    return cacheResponse;
  }

  save(key: string, value: HttpResponse<unknown>, options: CacheOptions): void {
    if (!options.isEnabled) return;

    this.cache.set(key, value);
  }
}
