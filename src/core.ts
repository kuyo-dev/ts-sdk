import {
  KuyoConfig,
  ErrorEvent,
  Transport,
  KuyoAdapter,
  KuyoSession,
} from "./types/sdk";
import { Environment } from "./types/common";

export class KuyoCore {
  private config: KuyoConfig;
  private transport: Transport;
  private adapter: KuyoAdapter | null = null;
  private session: KuyoSession | null = null;
  private endpoint: string;

  constructor(config: KuyoConfig, transport?: Transport) {
    this.config = {
      environment: "production",
      debug: false,
      vercel: {
        env: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
        publicVercelURL: process.env.NEXT_PUBLIC_VERCEL_URL || undefined,
        productionURL:
          process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || undefined,
        gitProvider: process.env.NEXT_PUBLIC_VERCEL_GIT_PROVIDER || undefined,
        commitRef: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || undefined,
        commitSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
        commitMessage:
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE || undefined,
        commitAuthor:
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_AUTHOR_NAME || undefined,
      },
      ...config,
    };

    this.endpoint = "http://localhost:4009/api/events";

    this.initSession();

    this.transport =
      transport || new FetchTransport(this.config, this.endpoint);
    this.log("Kuyo Core initialized");
  }

  private initSession() {
    const currentSession = sessionStorage.getItem("kuyo_session");
    if (currentSession) {
      this.session = JSON.parse(currentSession);
    } else {
      this.session = {
        id: `kuyo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`,
        environment: (this.config.environment as Environment) || "production",
        startedAt: Date.now(),
        endedAt: 0,
        duration: 0,
        userAgent: navigator.userAgent,
        ipAddress: "127.0.0.1",
      };
      sessionStorage.setItem("kuyo_session", JSON.stringify(this.session));
    }
  }

  private cleanSession() {
    sessionStorage.removeItem("kuyo_session");
    this.session = null;
  }

  /**
   * Register an adapter (Next.js, Vue, Node.js, etc.)
   */
  public useAdapter(adapter: KuyoAdapter): void {
    if (this.adapter) {
      this.adapter.teardown?.();
    }

    this.adapter = adapter;
    this.adapter.setup();
    this.log(`Adapter registered: ${adapter.name}`);
  }

  /**
   * Get the current adapter
   */
  public getAdapter(): KuyoAdapter | null {
    return this.adapter;
  }

  /**
   * Create a standardized error event
   */
  public createEvent(params: Partial<ErrorEvent>): ErrorEvent {
    const context = this.adapter?.getContext() || {};

    console.dir(this.session, { depth: null });

    return {
      id: this.generateId(),
      timestamp: Date.now(),
      platform: this.adapter?.name || "unknown",
      context,
      level: "error",
      session: this.session,
      ...params,
    } as ErrorEvent;
  }

  /**
   * Send an event through the transport
   */
  public async sendEvent(event: ErrorEvent): Promise<void> {
    try {
      this.log(`Sending event: ${event.message}`);
      await this.transport.send(event);
      this.log(`Event sent: ${event.id}`);
    } catch (error) {
      this.log(`Failed to send event: ${error}`, true);
    }
  }

  /**
   * Core method to capture exceptions
   */
  public captureException(error: Error, extra?: Record<string, any>): void {
    const event = this.createEvent({
      message: error.message,
      stack: error.stack,
      level: "error",
      extra,
    });

    this.sendEvent(event);
  }

  /**
   * Core method to capture messages
   */
  public captureMessage(
    message: string,
    level: ErrorEvent["level"] = "info",
    extra?: Record<string, any>
  ): void {
    const event = this.createEvent({
      message,
      level,
      extra,
    });

    this.sendEvent(event);
  }

  /**
   * Get current configuration
   */
  public getConfig(): KuyoConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<KuyoConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update transport if endpoint changed
    if (newConfig.apiKey) {
      this.transport = new FetchTransport(this.config, this.endpoint);
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.adapter?.teardown?.();
    this.adapter = null;
    this.cleanSession();
    this.log("Kuyo Core destroyed");
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private log(message: string, isError = false): void {
    if (this.config.debug) {
      const logMethod = isError ? console.error : console.log;
      logMethod(`[Kuyo:Core] ${message}`);
    }
  }
}

/**
 * Default Fetch transport implementation
 */
class FetchTransport implements Transport {
  constructor(
    private config: KuyoConfig,
    private endpoint: string
  ) {}

  async send(event: ErrorEvent): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "User-Agent": `Kuyo-SDK/${event.platform}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}
