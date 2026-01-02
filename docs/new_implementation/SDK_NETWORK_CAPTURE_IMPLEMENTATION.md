# SDK Network Capture Implementation Guide

## Status: PENDING

**Package:** `@boobalan_jkkn/bug-reporter-sdk`
**Current Version:** 1.1.0
**Target Version:** 1.2.0
**Repository:** External npm package (separate from this repo)

---

## Overview

This document provides implementation details for adding network request capture functionality to the Bug Reporter SDK. The backend is already configured to accept and display network trace data.

---

## Implementation Status

| Task | Status | Priority |
|------|--------|----------|
| Create `network-interceptor.ts` utility | ⏳ Pending | High |
| Update SDK configuration types | ⏳ Pending | High |
| Update `BugReporterProvider.tsx` | ⏳ Pending | High |
| Update `BugReporterWidget.tsx` | ⏳ Pending | High |
| Update `api/client.ts` payload | ⏳ Pending | Medium |
| Add unit tests | ⏳ Pending | Medium |
| Update SDK documentation | ⏳ Pending | Low |
| Bump version to 1.2.0 | ⏳ Pending | High |
| Publish to npm | ⏳ Pending | High |

---

## Backend Readiness

The backend is fully prepared to receive network trace data:

- [x] `NetworkRequest` type defined in `@bug-reporter/shared`
- [x] Bug submission API accepts `network_trace` field
- [x] Network trace stored in `metadata.network_trace` (JSONB)
- [x] Dashboard displays network trace with `NetworkTraceSection` component
- [x] Search and filtering in network trace UI
- [x] Error highlighting for failed requests

---

## Implementation Details

### 1. Network Interceptor Utility

**File:** `src/utils/network-interceptor.ts`

```typescript
import type { NetworkRequest } from '@bug-reporter/shared';

interface NetworkInterceptorConfig {
  bufferSize: number;
  excludePatterns: RegExp[];
}

class NetworkInterceptor {
  private buffer: NetworkRequest[] = [];
  private config: NetworkInterceptorConfig;
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send | null = null;
  private isInitialized = false;

  constructor(config: Partial<NetworkInterceptorConfig> = {}) {
    this.config = {
      bufferSize: config.bufferSize ?? 10,
      excludePatterns: config.excludePatterns ?? [
        /\/api\/v1\/public\/bug-reports/,  // Exclude SDK's own API calls
      ],
    };
  }

  /**
   * Initialize interceptors for fetch and XMLHttpRequest
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.interceptFetch();
    this.interceptXHR();
    this.isInitialized = true;
  }

  /**
   * Restore original fetch and XHR implementations
   */
  destroy(): void {
    if (!this.isInitialized) return;

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }

    if (this.originalXHROpen && this.originalXHRSend) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }

    this.buffer = [];
    this.isInitialized = false;
  }

  /**
   * Get captured network requests
   */
  getRequests(): NetworkRequest[] {
    return [...this.buffer];
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Check if URL should be excluded from capture
   */
  private shouldExclude(url: string): boolean {
    return this.config.excludePatterns.some(pattern => pattern.test(url));
  }

  /**
   * Add request to circular buffer
   */
  private addRequest(request: NetworkRequest): void {
    if (this.buffer.length >= this.config.bufferSize) {
      this.buffer.shift();
    }
    this.buffer.push(request);
  }

  /**
   * Extract headers from Headers object
   */
  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      // Filter out sensitive headers
      if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Intercept fetch API
   */
  private interceptFetch(): void {
    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (self.shouldExclude(url)) {
        return self.originalFetch!.call(window, input, init);
      }

      const startTime = Date.now();
      const method = init?.method || 'GET';
      const requestHeaders: Record<string, string> = {};

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
              requestHeaders[key] = value;
            }
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
              requestHeaders[key] = value;
            }
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
              requestHeaders[key] = value;
            }
          });
        }
      }

      try {
        const response = await self.originalFetch!.call(window, input, init);
        const duration = Date.now() - startTime;

        self.addRequest({
          id: crypto.randomUUID(),
          method: method.toUpperCase(),
          url,
          status: response.status,
          statusText: response.statusText,
          duration_ms: duration,
          request_headers: requestHeaders,
          response_headers: self.headersToObject(response.headers),
          timestamp: new Date().toISOString(),
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        self.addRequest({
          id: crypto.randomUUID(),
          method: method.toUpperCase(),
          url,
          status: 0,
          statusText: 'Failed',
          duration_ms: duration,
          request_headers: requestHeaders,
          response_headers: {},
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Network request failed',
        });

        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ): void {
      (this as any)._networkCapture = {
        method,
        url: url.toString(),
        startTime: 0,
        requestHeaders: {} as Record<string, string>,
      };

      return self.originalXHROpen!.call(this, method, url, async, username, password);
    };

    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name: string, value: string): void {
      if ((this as any)._networkCapture &&
          !['authorization', 'cookie', 'x-api-key'].includes(name.toLowerCase())) {
        (this as any)._networkCapture.requestHeaders[name] = value;
      }
      return originalSetRequestHeader.call(this, name, value);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      const capture = (this as any)._networkCapture;

      if (!capture || self.shouldExclude(capture.url)) {
        return self.originalXHRSend!.call(this, body);
      }

      capture.startTime = Date.now();

      this.addEventListener('loadend', function() {
        const duration = Date.now() - capture.startTime;
        const responseHeaders: Record<string, string> = {};

        const headerString = this.getAllResponseHeaders();
        if (headerString) {
          headerString.split('\r\n').forEach(line => {
            const [key, ...valueParts] = line.split(': ');
            if (key && !['set-cookie'].includes(key.toLowerCase())) {
              responseHeaders[key] = valueParts.join(': ');
            }
          });
        }

        self.addRequest({
          id: crypto.randomUUID(),
          method: capture.method.toUpperCase(),
          url: capture.url,
          status: this.status,
          statusText: this.statusText || (this.status === 0 ? 'Failed' : ''),
          duration_ms: duration,
          request_headers: capture.requestHeaders,
          response_headers: responseHeaders,
          timestamp: new Date().toISOString(),
          error: this.status === 0 ? 'Network request failed' : undefined,
        });
      });

      return self.originalXHRSend!.call(this, body);
    };
  }
}

// Singleton instance
let interceptorInstance: NetworkInterceptor | null = null;

export function createNetworkInterceptor(config?: Partial<NetworkInterceptorConfig>): NetworkInterceptor {
  if (!interceptorInstance) {
    interceptorInstance = new NetworkInterceptor(config);
  }
  return interceptorInstance;
}

export function getNetworkInterceptor(): NetworkInterceptor | null {
  return interceptorInstance;
}

export function destroyNetworkInterceptor(): void {
  if (interceptorInstance) {
    interceptorInstance.destroy();
    interceptorInstance = null;
  }
}

export { NetworkInterceptor };
```

---

### 2. Configuration Types Update

**File:** `src/types/config.ts`

```typescript
// Add to existing BugReporterConfig interface
export interface BugReporterConfig {
  // ... existing fields

  /**
   * Enable network request capture
   * @default true
   */
  networkCapture?: boolean;

  /**
   * Maximum number of network requests to capture (circular buffer)
   * @default 10
   */
  networkBufferSize?: number;

  /**
   * URL patterns to exclude from network capture
   * SDK's own API calls are automatically excluded
   */
  networkExcludePatterns?: RegExp[];
}
```

---

### 3. BugReporterProvider Update

**File:** `src/components/BugReporterProvider.tsx`

```typescript
import { createNetworkInterceptor, destroyNetworkInterceptor } from '../utils/network-interceptor';

// Inside BugReporterProvider component
useEffect(() => {
  // Initialize network interceptor if enabled
  if (config.networkCapture !== false) {
    const interceptor = createNetworkInterceptor({
      bufferSize: config.networkBufferSize ?? 10,
      excludePatterns: config.networkExcludePatterns,
    });
    interceptor.init();
  }

  return () => {
    // Cleanup on unmount
    destroyNetworkInterceptor();
  };
}, [config.networkCapture, config.networkBufferSize]);
```

---

### 4. BugReporterWidget Update

**File:** `src/components/BugReporterWidget.tsx`

```typescript
import { getNetworkInterceptor } from '../utils/network-interceptor';

// Inside submit handler
const handleSubmit = async () => {
  // Get captured network requests
  const networkInterceptor = getNetworkInterceptor();
  const networkTrace = networkInterceptor?.getRequests() ?? [];

  const payload: SubmitBugReportRequest = {
    // ... existing fields
    network_trace: networkTrace,
  };

  // Submit bug report
  await submitBugReport(payload);

  // Clear network buffer after submission
  networkInterceptor?.clear();
};
```

---

### 5. API Client Update

**File:** `src/api/client.ts`

```typescript
import type { SubmitBugReportRequest, NetworkRequest } from '@bug-reporter/shared';

// Ensure the payload type includes network_trace
interface BugReportPayload extends SubmitBugReportRequest {
  network_trace?: NetworkRequest[];
}
```

---

## Testing Plan

### Unit Tests

```typescript
// __tests__/network-interceptor.test.ts

describe('NetworkInterceptor', () => {
  beforeEach(() => {
    destroyNetworkInterceptor();
  });

  it('should capture fetch requests', async () => {
    const interceptor = createNetworkInterceptor({ bufferSize: 5 });
    interceptor.init();

    await fetch('https://api.example.com/test');

    const requests = interceptor.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://api.example.com/test');
  });

  it('should maintain circular buffer', async () => {
    const interceptor = createNetworkInterceptor({ bufferSize: 2 });
    interceptor.init();

    await fetch('https://api.example.com/1');
    await fetch('https://api.example.com/2');
    await fetch('https://api.example.com/3');

    const requests = interceptor.getRequests();
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe('https://api.example.com/2');
    expect(requests[1].url).toBe('https://api.example.com/3');
  });

  it('should exclude configured patterns', async () => {
    const interceptor = createNetworkInterceptor({
      excludePatterns: [/\/api\/v1\/public\/bug-reports/],
    });
    interceptor.init();

    await fetch('https://api.example.com/api/v1/public/bug-reports');
    await fetch('https://api.example.com/other');

    const requests = interceptor.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://api.example.com/other');
  });

  it('should capture failed requests', async () => {
    const interceptor = createNetworkInterceptor();
    interceptor.init();

    try {
      await fetch('https://invalid-domain-12345.com/test');
    } catch {}

    const requests = interceptor.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].status).toBe(0);
    expect(requests[0].error).toBeDefined();
  });

  it('should filter sensitive headers', async () => {
    const interceptor = createNetworkInterceptor();
    interceptor.init();

    await fetch('https://api.example.com/test', {
      headers: {
        'Authorization': 'Bearer secret',
        'Content-Type': 'application/json',
      },
    });

    const requests = interceptor.getRequests();
    expect(requests[0].request_headers['Authorization']).toBeUndefined();
    expect(requests[0].request_headers['Content-Type']).toBe('application/json');
  });
});
```

---

## Security Considerations

### Headers Filtering
The following headers are automatically filtered out:
- `Authorization`
- `Cookie`
- `X-API-Key`
- `Set-Cookie` (response)

### Request Body
Request and response bodies are **NOT** captured to:
- Avoid memory issues with large payloads
- Prevent sensitive data exposure
- Keep payload size manageable

### URL Exclusions
SDK's own API calls are automatically excluded to prevent:
- Recursive capture
- Noise in captured data

---

## Usage Example

```tsx
import { BugReporterProvider } from '@boobalan_jkkn/bug-reporter-sdk';

function App() {
  return (
    <BugReporterProvider
      apiKey="your-api-key"
      apiEndpoint="https://your-dashboard.com/api/v1/public/bug-reports"
      networkCapture={true}        // Enable network capture (default: true)
      networkBufferSize={10}       // Capture last 10 requests (default: 10)
      networkExcludePatterns={[    // Optional: additional exclusions
        /analytics/,
        /tracking/,
      ]}
    >
      <YourApp />
    </BugReporterProvider>
  );
}
```

---

## Release Checklist

- [ ] Implement `network-interceptor.ts`
- [ ] Update configuration types
- [ ] Update `BugReporterProvider.tsx`
- [ ] Update `BugReporterWidget.tsx`
- [ ] Update `api/client.ts`
- [ ] Add unit tests
- [ ] Test with real applications
- [ ] Update README documentation
- [ ] Update CHANGELOG
- [ ] Bump version to 1.2.0
- [ ] Build package
- [ ] Publish to npm
- [ ] Tag release on GitHub

---

## Changelog Entry

```markdown
## [1.2.0] - YYYY-MM-DD

### Added
- Network request capture functionality
- New configuration options: `networkCapture`, `networkBufferSize`, `networkExcludePatterns`
- Automatic filtering of sensitive headers (Authorization, Cookie, X-API-Key)
- Circular buffer for efficient memory usage

### Changed
- Bug report submission now includes `network_trace` array

### Security
- Sensitive headers are automatically filtered from captured requests
- Request/response bodies are not captured
```

---

## Support

For questions or issues with this implementation:
1. Check the main dashboard repository issues
2. Review the `NetworkTraceSection` component for expected data format
3. Test with the dashboard to verify data flow
