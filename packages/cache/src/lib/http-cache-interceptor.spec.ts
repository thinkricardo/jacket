import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

import { of } from 'rxjs';

import {
  createServiceFactory,
  HttpMethod,
  SpectatorService,
} from '@ngneat/spectator/jest';

import { HttpCacheInterceptor } from './http-cache-interceptor';

import { CacheOptions, withCache } from './cache-options';

describe(HttpCacheInterceptor.name, () => {
  let spectator: SpectatorService<HttpCacheInterceptor>;
  const createService = createServiceFactory(HttpCacheInterceptor);

  beforeEach(() => (spectator = createService()));

  const createFakeResponse = () =>
    new HttpResponse<unknown>({ status: 200, body: 'ok' });

  const createFakeGetRequest = (
    options: CacheOptions = buildOptions()
  ): HttpRequest<unknown> =>
    new HttpRequest(HttpMethod.GET, '/fake', {
      context: withCache(options),
    });

  const createFakePostRequest = (
    options: CacheOptions = buildOptions()
  ): HttpRequest<unknown> =>
    new HttpRequest(
      HttpMethod.POST,
      '/fake',
      {},
      {
        context: withCache(options),
      }
    );

  const createMockHandler = () => {
    return <HttpHandler>{
      handle: jest.fn(() => of(createFakeResponse())),
    };
  };

  const callIntercept = (
    request: HttpRequest<unknown>,
    handler: HttpHandler
  ) => {
    spectator.service.intercept(request, handler).subscribe();
  };

  const buildOptions = (options?: CacheOptions): CacheOptions => {
    return {
      isEnabled: true,
      ...options,
    };
  };

  const createSpySave = () => jest.spyOn(spectator.service, 'save');

  describe('call handler', () => {
    it('should not call handler after initial request', () => {
      const mockHandler = createMockHandler();
      const request = createFakeGetRequest();

      callIntercept(request, mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);

      callIntercept(request, mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache value', () => {
    it('should cache value when is get request', () => {
      const spySave = createSpySave();

      callIntercept(createFakeGetRequest(), createMockHandler());

      expect(spySave).toHaveBeenCalled();
      expect(spectator.service.get('/fake', buildOptions())).toEqual(
        createFakeResponse()
      );
    });

    it('should not cache value when is not get request', () => {
      const spySave = createSpySave();

      callIntercept(createFakePostRequest(), createMockHandler());

      expect(spySave).not.toHaveBeenCalled();
      expect(spectator.service.get('/fake', buildOptions())).toBeUndefined();
    });
  });

  describe('is enabled', () => {
    it('should cache value when enabled', () => {
      const options = buildOptions({ isEnabled: true });

      callIntercept(createFakeGetRequest(options), createMockHandler());

      expect(spectator.service.get('/fake', options)).toEqual(
        createFakeResponse()
      );
    });

    it('should not cache value when not enabled', () => {
      const options = buildOptions({ isEnabled: false });

      callIntercept(createFakeGetRequest(options), createMockHandler());

      expect(spectator.service.get('/fake', options)).toBeUndefined();
    });
  });
});
