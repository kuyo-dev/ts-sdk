import { KuyoCore } from "./core";
import { NextJSAdapter } from "./adapters/nextjs";
import type { KuyoConfig, ErrorEvent, ReactComponentType } from "@kuyo/types";

// Global core instance
let globalCore: KuyoCore | null = null;

/**
 * Initialize Kuyo SDK with Next.js adapter
 */
export function init(config: KuyoConfig): void {
  // Create core instance
  globalCore = new KuyoCore(config);

  // Setup Next.js adapter automatically
  const nextjsAdapter = new NextJSAdapter(globalCore);
  globalCore.useAdapter(nextjsAdapter);
}

/**
 * Capture an exception
 */
export function captureException(
  error: Error,
  extra?: Record<string, any>
): void {
  if (!globalCore) {
    console.warn("[Kuyo] SDK not initialized. Call init() first.");
    return;
  }
  globalCore.captureException(error, extra);
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level?: ErrorEvent["level"],
  extra?: Record<string, any>
): void {
  if (!globalCore) {
    console.warn("[Kuyo] SDK not initialized. Call init() first.");
    return;
  }
  globalCore.captureMessage(message, level, extra);
}

/**
 * Get the global core instance (for advanced usage)
 */
export function getCore(): KuyoCore | null {
  return globalCore;
}

/**
 * Cleanup and destroy the SDK
 */
export function destroy(): void {
  if (globalCore) {
    globalCore.destroy();
    globalCore = null;
  }
}

// Default export
export default {
  init,
  captureException,
  captureMessage,
  getCore,
  destroy,
};

// Export core classes for custom adapters
export { KuyoCore } from "./core";
export { NextJSAdapter } from "./adapters/nextjs";

/**
 * Get the NextJS adapter instance
 */
function getNextJSAdapter(): NextJSAdapter | null {
  if (!globalCore) {
    console.warn("[Kuyo] SDK not initialized. Call init() first.");
    return null;
  }
  const adapter = globalCore.getAdapter();
  if (!adapter || adapter.name !== "nextjs") {
    console.warn(
      "[Kuyo] Next.js adapter not found. Make sure to call init() first."
    );
    return null;
  }
  return adapter as NextJSAdapter;
}

/**
 * Wrap a Next.js page component with error tracking
 */
export function withKuyoPage<T extends ReactComponentType>(
  PageComponent: T
): T {
  const adapter = getNextJSAdapter();
  if (!adapter) return PageComponent;
  return adapter.wrapPage(PageComponent) as T;
}

/**
 * Wrap a Next.js API route handler with error tracking
 */
export function withKuyoAPI<T extends (...args: any[]) => any>(handler: T): T {
  const adapter = getNextJSAdapter();
  if (!adapter) return handler;
  return adapter.wrapApiRoute(handler);
}

/**
 * Wrap a Next.js app component with error tracking
 */
export function withKuyo<T extends ReactComponentType>(AppComponent: T): T {
  const adapter = getNextJSAdapter();
  if (!adapter) return AppComponent;
  return adapter.wrapApp(AppComponent) as T;
}
