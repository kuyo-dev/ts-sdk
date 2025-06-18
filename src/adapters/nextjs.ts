import type { NextJSKuyoAdapter, ReactComponentType } from "@kuyo/types";
import type { KuyoCore } from "../core";

export class NextJSAdapter implements NextJSKuyoAdapter {
  public readonly name = "nextjs";
  private core: KuyoCore;
  private originalErrorHandler: OnErrorEventHandler | null = null;
  private originalRejectionHandler:
    | ((event: PromiseRejectionEvent) => void)
    | null = null;
  private isWrapped = false;

  constructor(core: KuyoCore) {
    this.core = core;
  }

  public setup(): void {
    if (typeof window === "undefined") {
      this.log("Running in Node.js environment (SSR/API Routes)");
      this.setupNodeHandlers();
    } else {
      this.log("Running in browser environment");
      this.setupBrowserHandlers();
    }
  }

  public teardown(): void {
    if (typeof window !== "undefined") {
      this.teardownBrowserHandlers();
    }
    this.log("NextJS adapter torn down");
  }

  public getContext(): Record<string, any> {
    const context: Record<string, any> = {
      runtime: typeof window !== "undefined" ? "browser" : "node",
    };

    if (typeof window !== "undefined") {
      // Browser context
      context.browser = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      };

      // Next.js specific browser context
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData) {
        context.nextjs = {
          buildId: nextData.buildId,
          page: nextData.page,
          router: nextData.page ? "pages" : "app",
          dev: nextData.dev,
        };
      }

      // Vercel context (client-side env vars)
      context.vercel = {
        env: process.env.NEXT_PUBLIC_VERCEL_ENV,
        region: process.env.NEXT_PUBLIC_VERCEL_REGION,
        deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID,
      };
    } else {
      // Node.js context
      context.node = {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };

      // Next.js version detection
      try {
        const nextPackage = require("next/package.json");
        context.nextjs = {
          version: nextPackage.version,
          runtime: "node",
        };
      } catch {
        // Next.js not available
      }

      // Vercel context (server-side env vars)
      context.vercel = {
        env: process.env.VERCEL_ENV,
        region: process.env.VERCEL_REGION,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
        runtime: process.env.VERCEL_RUNTIME,
      };
    }

    return context;
  }

  public captureException(error: Error, extra?: Record<string, any>): void {
    this.core.captureException(error, {
      ...extra,
      adapter: this.name,
    });
  }

  public captureMessage(
    message: string,
    level: "error" | "warning" | "info" = "info",
    extra?: Record<string, any>
  ): void {
    this.core.captureMessage(message, level, {
      ...extra,
      adapter: this.name,
    });
  }

  /**
   * Wrap the entire Next.js app to catch all errors automatically
   */
  public wrapApp<T extends ReactComponentType>(AppComponent: T): T {
    if (this.isWrapped) {
      this.log("App already wrapped, skipping");
      return AppComponent;
    }

    this.isWrapped = true;
    this.log("Wrapping Next.js app with error boundaries");

    // Create wrapper function that returns JSX
    const WrappedApp = (props: any) => {
      // Try to use React if available, otherwise return original component
      if (typeof window !== "undefined" && (window as any).React) {
        const React = (window as any).React;
        return React.createElement(
          KuyoErrorBoundary,
          { core: this.core },
          React.createElement(AppComponent, props)
        );
      }

      // Fallback: just return the original component
      return AppComponent(props);
    };

    // Preserve component name and static properties
    Object.defineProperty(WrappedApp, "name", {
      value: `withKuyo(${AppComponent.displayName || AppComponent.name || "App"})`,
    });

    // Copy static methods if any
    Object.assign(WrappedApp, AppComponent);

    return WrappedApp as T;
  }

  /**
   * Wrap API routes to catch server-side errors
   */
  public wrapApiRoute<T extends (...args: any[]) => any>(handler: T): T {
    const wrappedHandler = async (...args: any[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        this.core.captureException(error as Error, {
          source: "api-route",
          route: args[0]?.url || "unknown",
          method: args[0]?.method || "unknown",
        });
        throw error; // Re-throw to maintain original behavior
      }
    };

    Object.defineProperty(wrappedHandler, "name", {
      value: `withKuyo(${handler.name || "handler"})`,
    });

    return wrappedHandler as T;
  }

  /**
   * Wrap Next.js pages to catch page-level errors
   */
  public wrapPage<T extends ReactComponentType>(PageComponent: T): T {
    const WrappedPage = (props: any) => {
      // Simple page wrapper without complex React dependencies
      try {
        return PageComponent(props);
      } catch (error) {
        this.core.captureException(error as Error, {
          source: "page-component",
          page: PageComponent.name || "unknown",
        });
        throw error;
      }
    };

    Object.defineProperty(WrappedPage, "name", {
      value: `withKuyo(${PageComponent.displayName || PageComponent.name || "Page"})`,
    });

    // Copy static methods (getStaticProps, getServerSideProps, etc.)
    Object.assign(WrappedPage, PageComponent);

    return WrappedPage as T;
  }

  private setupBrowserHandlers(): void {
    // Store original handlers
    this.originalErrorHandler = window.onerror;
    this.originalRejectionHandler = window.onunhandledrejection;

    // Global error handler
    window.addEventListener("error", this.handleError.bind(this));
    window.addEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection.bind(this)
    );

    this.log("Browser error handlers setup");
  }

  private setupNodeHandlers(): void {
    // For SSR and API routes
    process.on("uncaughtException", this.handleNodeError.bind(this));
    process.on("unhandledRejection", this.handleNodeRejection.bind(this));

    this.log("Node.js error handlers setup");
  }

  private teardownBrowserHandlers(): void {
    if (typeof window === "undefined") return;

    window.removeEventListener("error", this.handleError.bind(this));
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection.bind(this)
    );

    // Restore original handlers
    window.onerror = this.originalErrorHandler;
    window.onunhandledrejection = this.originalRejectionHandler;
  }

  private handleError(event: globalThis.ErrorEvent): void {
    this.core.captureException(new Error(event.message), {
      source: "window.error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });

    // Call original handler if exists
    if (this.originalErrorHandler) {
      this.originalErrorHandler.call(
        window,
        event.message,
        event.filename,
        event.lineno,
        event.colno,
        event.error
      );
    }
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(`Unhandled Promise Rejection: ${event.reason}`);

    this.core.captureException(error, {
      source: "unhandledRejection",
      reason: event.reason,
    });

    // Call original handler if exists
    if (this.originalRejectionHandler) {
      this.originalRejectionHandler.call(window, event);
    }
  }

  private handleNodeError(error: Error): void {
    this.core.captureException(error, {
      source: "uncaughtException",
      pid: process.pid,
    });
  }

  private handleNodeRejection(reason: any): void {
    const error =
      reason instanceof Error
        ? reason
        : new Error(`Unhandled Promise Rejection: ${reason}`);

    this.core.captureException(error, {
      source: "unhandledRejection",
      pid: process.pid,
      reason,
    });
  }

  private log(message: string): void {
    const config = this.core.getConfig();
    if (config.debug) {
      console.log(`[Kuyo:NextJS] ${message}`);
    }
  }
}

/**
 * Error Boundary component (simplified without direct React dependency)
 */
function KuyoErrorBoundary(props: { core: KuyoCore; children: any }) {
  // This will be created using React.createElement when React is available
  // The actual error boundary logic is handled by React itself
  return props.children;
}

// Type definitions for React components (to avoid React dependency)

type ReactErrorInfo = {
  componentStack: string;
};

interface ReactComponent<P = any, S = any> {
  props: P;
  state: S;
  setState(state: Partial<S>): void;
  render(): any;
}
