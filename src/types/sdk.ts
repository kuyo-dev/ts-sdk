// ===== SDK CORE TYPES =====

import { Environment } from "./common";

export interface KuyoConfig {
  apiKey: string;
  environment?: string;
  debug?: boolean;
  vercel?: VercelConfig;
}

export interface VercelConfig {
  env?: string;
  publicVercelURL?: string;
  productionURL?: string;
  gitProvider?: string;
  commitRef?: string;
  commitSha?: string;
  commitMessage?: string;
  commitAuthor?: string;
}

export interface KuyoSession {
  id: string;
  environment: Environment;
  startedAt: number;
  endedAt: number;
  duration: number;
  userAgent: string;
  ipAddress: string;
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  level: "error" | "warning" | "info";
  platform: string; // 'nextjs', 'vue', 'node', etc.
  context: Record<string, any>;
  extra?: Record<string, any>;
  session: KuyoSession;
}

export interface Transport {
  send(event: ErrorEvent): Promise<void>;
}

// ===== ADAPTER INTERFACES =====

export interface KuyoAdapter {
  readonly name: string;
  setup(): void;
  teardown?(): void;
  getContext(): Record<string, any>;
  captureException(error: Error, extra?: Record<string, any>): void;
  captureMessage(
    message: string,
    level?: ErrorEvent["level"],
    extra?: Record<string, any>
  ): void;
}

// ===== REACT TYPES =====

export type ReactComponentType<P = any> = {
  (props: P): any;
  displayName?: string;
  name?: string;
};

export interface ReactKuyoAdapter extends KuyoAdapter {
  wrapApp<T extends ReactComponentType>(AppComponent: T): T;
  wrapPage<T extends ReactComponentType>(PageComponent: T): T;
}

// ===== API TYPES =====

export interface APIKuyoAdapter extends KuyoAdapter {
  wrapApiRoute<T extends (...args: any[]) => any>(handler: T): T;
}

// ===== FRAMEWORK SPECIFIC =====

export interface NextJSKuyoAdapter extends ReactKuyoAdapter, APIKuyoAdapter {
  // Next.js specific methods can be added here if needed
}

export interface VueKuyoAdapter extends KuyoAdapter {
  // Vue specific methods
  wrapApp<T>(app: T): T;
  wrapComponent<T>(component: T): T;
}

export interface NodeKuyoAdapter extends APIKuyoAdapter {
  // Node.js specific methods
  wrapServer<T>(server: T): T;
  wrapExpress<T>(app: T): T;
}
