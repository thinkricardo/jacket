import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';

import { Observable, of, tap } from 'rxjs';

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

    const cacheResponse = this.get(request.url);
    if (cacheResponse) {
      return of(cacheResponse);
    }

    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          this.save(request.url, event);
        }
      })
    );
  }

  get(key: string): HttpResponse<unknown> | undefined {
    return this.cache.get(key);
  }

  save(key: string, value: HttpResponse<unknown>) {
    this.cache.set(key, value);
  }
}
