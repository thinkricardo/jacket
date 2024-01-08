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

  const createFakeRequest = () =>
    new HttpRequest<unknown>(HttpMethod.GET, '/fake');

  const createMockHandler = () => {
    return <HttpHandler>{
      handle: jest.fn(() => of(createFakeResponse())),
    };
  };

  const callIntercept = (handler: HttpHandler) => {
    spectator.service.intercept(createFakeRequest(), handler).subscribe();
  };

  describe('handler', () => {
    it('should not call handler after initial request', () => {
      const mockHandler = createMockHandler();

      callIntercept(mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);

      callIntercept(mockHandler);
      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });
  });
});
