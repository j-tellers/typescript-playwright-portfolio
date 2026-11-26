import { errors, type APIRequestContext, type APIResponse } from '@playwright/test';

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  form?: Record<string, string>;
  throwOnError?: boolean; // crucial for negative QA tests
}

export interface HttpResult<T> {
  status: number;
  headers: Record<string, string>;
  body: T | string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly method: HttpMethod,
    public readonly endpoint: string,
  ) {
    super(`${method} ${endpoint} failed with HTTP ${status}`);
    this.name = "HttpError";
  }
}

export class HttpRequestError extends Error {
  constructor(
    public readonly method: HttpMethod,
    public readonly endpoint: string,
    public readonly reason: "invalid-url" | "timeout" | "network" | "response",
    public readonly status?: number,
  ) {
    const detail = reason === "invalid-url" ? "has an invalid URL" :
      reason === "timeout" ? "timed out" :
      reason === "network" ? "failed to complete the request" : "failed to read the response";
    super(`${method} ${endpoint} ${detail}${status === undefined ? "" : ` (HTTP ${status})`}`);
    this.name = "HttpRequestError";
  }
}

export class HttpResponseParseError extends Error {
  constructor(
    public readonly status: number,
    public readonly method: HttpMethod,
    public readonly endpoint: string,
  ) {
    super(`${method} ${endpoint} returned invalid JSON (HTTP ${status})`);
    this.name = "HttpResponseParseError";
  }
}

export class HttpClient {
  private readonly defaultHeaders: Headers;

  constructor(
    private readonly requestContext: APIRequestContext,
    private readonly baseUrl: string,
    private readonly defaultTimeoutMs = 10_000,
    headers: Record<string, string> = { Accept: "application/json" },
  ) {
    this.defaultHeaders = new Headers(headers);
  }

  async request<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<HttpResult<T>> {
    let url: URL;
    try {
      url = new URL(path, this.baseUrl);
    } catch {
      throw new HttpRequestError(method, "[invalid URL]", "invalid-url");
    }
    const endpoint = url.pathname;
    for (const [k, v] of Object.entries(opts.params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const headers = new Headers(this.defaultHeaders);
    for (const [k, v] of Object.entries(opts.headers ?? {})) {
      headers.set(k, v);
    }

    if (opts.body !== undefined && opts.form !== undefined) {
      throw new Error("A request cannot contain both a JSON body and form fields.");
    }

    let data: string | undefined;
    if (opts.body !== undefined) {
      headers.set("Content-Type", "application/json");
      data = JSON.stringify(opts.body);
    }

    let res: APIResponse;
    try {
      res = await this.requestContext.fetch(url.toString(), {
        method,
        headers: Object.fromEntries(headers.entries()),
        data,
        form: opts.form,
        timeout: this.defaultTimeoutMs,
        failOnStatusCode: false,
      });
    } catch (error) {
      throw new HttpRequestError(method, endpoint, error instanceof errors.TimeoutError ? "timeout" : "network");
    }

    let raw: string;
    try {
      raw = await res.text();
    } catch {
      throw new HttpRequestError(method, endpoint, "response", res.status());
    }
    if (!res.ok() && (opts.throwOnError ?? true)) {
      throw new HttpError(res.status(), method, endpoint);
    }

    const responseHeaders = res.headers();
    const isJson = (responseHeaders["content-type"] ?? "").includes("application/json");
    let parsed: unknown = raw;
    if (isJson && raw.length > 0) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        if (res.ok()) {
          throw new HttpResponseParseError(res.status(), method, endpoint);
        }
      }
    }

    return {
      status: res.status(),
      headers: responseHeaders,
      body: parsed as T | string,
    };
  }

  get<T>(path: string, opts?: Omit<RequestOptions, "body">) {
    return this.request<T>("GET", path, opts);
  }
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) {
    return this.request<T>("POST", path, { ...opts, body });
  }
  put<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) {
    return this.request<T>("PUT", path, { ...opts, body });
  }
  patch<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) {
    return this.request<T>("PATCH", path, { ...opts, body });
  }
  delete<T>(path: string, opts?: Omit<RequestOptions, "body">) {
    return this.request<T>("DELETE", path, opts);
  }
}