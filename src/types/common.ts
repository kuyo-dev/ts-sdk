// ===== COMMON UTILITY TYPES =====

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

// ===== ENVIRONMENT TYPES =====

export type Environment = "development" | "staging" | "production" | "test";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

// ===== FRAMEWORK DETECTION =====

export type FrameworkType =
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "svelte"
  | "angular"
  | "express"
  | "fastify"
  | "node"
  | "unknown";

export type RuntimeType =
  | "browser"
  | "node"
  | "edge"
  | "worker"
  | "deno"
  | "bun";

// ===== PLATFORM CONTEXT =====

export interface BrowserContext {
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  language?: string;
  cookieEnabled?: boolean;
}

export interface NodeContext {
  version: string;
  platform: string;
  arch: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  env?: string;
}

export interface NextJSContext {
  version?: string;
  buildId?: string;
  router: "pages" | "app";
  page?: string;
  route?: string;
  dev: boolean;
}

export interface VercelContext {
  deploymentId?: string;
  deploymentUrl?: string;
  region?: string;
  runtime?: string;
  environment?: string;
  branch?: string;
  commitSha?: string;
}

// ===== HTTP TYPES =====

export interface HttpMethod {
  GET: "GET";
  POST: "POST";
  PUT: "PUT";
  DELETE: "DELETE";
  PATCH: "PATCH";
  HEAD: "HEAD";
  OPTIONS: "OPTIONS";
}

export interface HttpStatus {
  OK: 200;
  CREATED: 201;
  NO_CONTENT: 204;
  BAD_REQUEST: 400;
  UNAUTHORIZED: 401;
  FORBIDDEN: 403;
  NOT_FOUND: 404;
  INTERNAL_SERVER_ERROR: 500;
}

// ===== CONFIG TYPES =====

export interface MonorepoConfig {
  packages: {
    sdk: string;
    api: string;
    types: string;
    dashboard?: string;
  };
  shared: {
    eslint: boolean;
    prettier: boolean;
    typescript: boolean;
  };
}

// ===== ERROR TYPES =====

export interface KuyoError extends Error {
  code?: string;
  statusCode?: number;
  context?: Record<string, any>;
}

export class ValidationError extends Error implements KuyoError {
  code = "VALIDATION_ERROR";
  statusCode = 400;

  constructor(
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConfigError extends Error implements KuyoError {
  code = "CONFIG_ERROR";

  constructor(
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "ConfigError";
  }
}
