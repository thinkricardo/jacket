import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

import { of } from 'rxjs';

import { createServiceFactory, HttpMethod, SpectatorService } from '@ngneat/spectator/jest';

import { HttpCacheInterceptor } from './http-cache-interceptor';
import { CACHE_OPTIONS_TOKEN, CacheOptions, withCache } from './cache-options';

jest.useFakeTimers();

const testData = {
  iterations: 4,
  url: '/fake',
  key: 'cache-key',
  ttl: 1000,
};

const createFakeResponse = () =>
  new HttpResponse({
    status: 200,
    body: 'ok',
  });

const createFakeGetRequest = (options?: CacheOptions) =>
  new HttpRequest(HttpMethod.GET, testData.url, {
    context: options ? withCache(options) : undefined,
  });

const createFakePostRequest = (options?: CacheOptions) =>
  new HttpRequest(
    HttpMethod.POST,
    testData.url,
    {},
    {
      context: options ? withCache(options) : undefined,
    }
  );

const createMockHandler = () =>
  <HttpHandler>{
    handle: jest.fn(() => of(createFakeResponse())),
  };

const getOptions = (request: HttpRequest<unknown>) => request.context.get(CACHE_OPTIONS_TOKEN);

const generateIterations = () => [...Array(testData.iterations).keys()];

describe(HttpCacheInterceptor.name, () => {
  let spectator: SpectatorService<HttpCacheInterceptor>;
  const createService = createServiceFactory(HttpCacheInterceptor);

  beforeEach(() => (spectator = createService()));

  const callIntercept = (request: HttpRequest<unknown>, handler: HttpHandler) => {
    spectator.service.intercept(request, handler).subscribe();
  };

  const createSpySave = () => jest.spyOn(spectator.service, 'save');
  const createSpyDelete = () => jest.spyOn(spectator.service, 'delete');

  describe('defaults', () => {
    it('should have cache disabled by default', () => {
      const request = createFakeGetRequest();

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(false);
    });
  });

  describe('http handler', () => {
    it('should call handler only once if cache is enabled', () => {
      const mockHandler = createMockHandler();
      const request = createFakeGetRequest({
        isEnabled: true,
      });

      let numberOfRequests = 0;

      generateIterations().forEach(() => {
        callIntercept(request, mockHandler);
        numberOfRequests++;
      });

      expect(request.method).toBe(HttpMethod.GET);
      expect(numberOfRequests).toBe(testData.iterations);
      expect(getOptions(request).isEnabled).toBe(true);

      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('should call handler always if cache is disabled', () => {
      const mockHandler = createMockHandler();
      const request = createFakeGetRequest({
        isEnabled: false,
      });

      let numberOfRequests = 0;

      generateIterations().forEach(() => {
        callIntercept(request, mockHandler);
        numberOfRequests++;
      });

      expect(request.method).toBe(HttpMethod.GET);
      expect(numberOfRequests).toBe(testData.iterations);
      expect(getOptions(request).isEnabled).toBe(false);

      expect(mockHandler.handle).toHaveBeenCalledTimes(testData.iterations);
    });
  });

  describe('request method', () => {
    it('should cache value when is get request', () => {
      const spySave = createSpySave();
      const request = createFakeGetRequest({
        isEnabled: true,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);

      expect(spySave).toHaveBeenCalled();
      expect(spectator.service.exists(testData.url)).toBe(true);
    });

    it('should not cache value when is not get request', () => {
      const spySave = createSpySave();
      const request = createFakePostRequest({
        isEnabled: true,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).not.toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);

      expect(spySave).not.toHaveBeenCalled();
      expect(spectator.service.exists(testData.url)).toBe(false);
    });
  });

  describe('is enabled', () => {
    it('should cache value when is enabled', () => {
      const request = createFakeGetRequest({
        isEnabled: true,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);

      expect(spectator.service.exists(testData.url)).toBe(true);
    });

    it('should not cache value when is disabled', () => {
      const request = createFakeGetRequest({
        isEnabled: false,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(false);

      expect(spectator.service.exists(testData.url)).toBe(false);
    });

    it('should delete cached value if enabled is turned off', () => {
      const mockHandler = createMockHandler();
      const spyDelete = createSpyDelete();

      const enabledRequest = createFakeGetRequest({
        isEnabled: true,
      });

      const disabledRequest = createFakeGetRequest({
        isEnabled: false,
      });

      callIntercept(enabledRequest, mockHandler);
      callIntercept(disabledRequest, mockHandler);

      expect(enabledRequest.method).toBe(HttpMethod.GET);
      expect(getOptions(enabledRequest).isEnabled).toBe(true);

      expect(disabledRequest.method).toBe(HttpMethod.GET);
      expect(getOptions(disabledRequest).isEnabled).toBe(false);

      expect(spyDelete).toHaveBeenCalledTimes(1);
      expect(spectator.service.exists(testData.url)).toBe(false);
    });
  });

  describe('key', () => {
    it('should use key if provided', () => {
      const spySave = createSpySave();
      const request = createFakeGetRequest({
        isEnabled: true,
        key: testData.key,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);
      expect(getOptions(request).key).toBe(testData.key);

      expect(spySave).toHaveBeenCalled();
      expect(spectator.service.exists(testData.key)).toBe(true);
      expect(spectator.service.exists(testData.url)).toBe(false);
    });

    it('should use url if key not provided', () => {
      const spySave = createSpySave();
      const request = createFakeGetRequest({
        isEnabled: true,
      });

      callIntercept(request, createMockHandler());

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);
      expect(getOptions(request).key).toBeUndefined();

      expect(spySave).toHaveBeenCalled();
      expect(spectator.service.exists(testData.url)).toBe(true);
    });
  });

  describe('ttl', () => {
    it('should remove cache when expired and execute request', () => {
      const mockHandler = createMockHandler();
      const spyDelete = createSpyDelete();

      const request = createFakeGetRequest({
        isEnabled: true,
        ttl: testData.ttl,
      });

      callIntercept(request, mockHandler);

      jest.advanceTimersByTime(testData.ttl + 1);

      callIntercept(request, mockHandler);

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);
      expect(getOptions(request).ttl).toBe(testData.ttl);

      expect(spyDelete).toHaveBeenCalled();
      expect(mockHandler.handle).toHaveBeenCalledTimes(2);
    });

    it('should retrieve value from cache when not expired and not execute request', () => {
      const mockHandler = createMockHandler();

      const request = createFakeGetRequest({
        isEnabled: true,
        ttl: testData.ttl,
      });

      callIntercept(request, mockHandler);

      jest.advanceTimersByTime(testData.ttl - 1);

      callIntercept(request, mockHandler);

      expect(request.method).toBe(HttpMethod.GET);
      expect(getOptions(request).isEnabled).toBe(true);
      expect(getOptions(request).ttl).toBe(testData.ttl);

      expect(mockHandler.handle).toHaveBeenCalledTimes(1);
    });
  });
});
