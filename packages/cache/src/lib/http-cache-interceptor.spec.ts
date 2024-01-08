import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

import { of } from 'rxjs';

import {
  createServiceFactory,
  HttpMethod,
  SpectatorService,
} from '@ngneat/spectator/jest';

import { HttpCacheInterceptor } from './http-cache-interceptor';

describe(HttpCacheInterceptor.name, () => {
  let spectator: SpectatorService<HttpCacheInterceptor>;
  const createService = createServiceFactory(HttpCacheInterceptor);

  beforeEach(() => (spectator = createService()));

  const createFakeResponse = () =>
    new HttpResponse<unknown>({ status: 200, body: 'ok' });

  const createFakeGetRequest = (): HttpRequest<unknown> =>
    new HttpRequest(HttpMethod.GET, '/fake');
  const createFakePostRequest = (): HttpRequest<unknown> =>
    new HttpRequest(HttpMethod.POST, '/fake', {});

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

  const createSpySave = () => jest.spyOn(spectator.service, 'save');

  describe('handler', () => {
    it('should not call handler after initial request', () => {
      const mockHandler = createMockHandler();
      const request = createFakeGetRequest();

      callIntercept(request, mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);

      callIntercept(request, mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache', () => {
    it('should cache value when is get request', () => {
      const spySave = createSpySave();

      callIntercept(createFakeGetRequest(), createMockHandler());

      expect(spySave).toHaveBeenCalled();
      expect(spectator.service.get('/fake')).toEqual(createFakeResponse());
    });

    it('should not cache value when is not get request', () => {
      const spySave = createSpySave();

      callIntercept(createFakePostRequest(), createMockHandler());

      expect(spySave).not.toHaveBeenCalled();
      expect(spectator.service.get('/fake')).toBeUndefined();
    });
  });
});
