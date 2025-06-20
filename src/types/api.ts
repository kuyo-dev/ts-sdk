// ===== API REQUEST/RESPONSE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ===== ERROR EVENT TYPES (server-side enhanced) =====

export interface ServerErrorEvent {
  // Base event (same as SDK)
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  level: "error" | "warning" | "info";
  platform: string;
  context: Record<string, any>;
  extra?: Record<string, any>;

  // Server-side additions
  receivedAt?: string;
  apiKey?: string;
  serverContext?: ServerContext;
}

export interface ServerContext {
  receivedFromIP: string;
  userAgent: string;
  receivedAt: string;
  requestId?: string;
}

// ===== VALIDATION SCHEMAS =====

export interface EventValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitizedEvent?: ServerErrorEvent;
}

// ===== STATS & ANALYTICS =====

export interface EventStats {
  total: number;
  last24h: number;
  byLevel: Record<string, number>;
  byPlatform: Record<string, number>;
  oldest?: string;
  newest?: string;
}

export interface EventFilters {
  level?: string[];
  platform?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// ===== DATABASE TYPES =====

export interface EventDocument {
  _id?: string;
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  level: string;
  platform: string;
  context: any;
  extra?: any;
  receivedAt: Date;
  apiKey: string;
  serverContext: ServerContext;

  // Computed fields
  fingerprint?: string;
  groupId?: string;
  resolved?: boolean;
  tags?: string[];
}

export interface ProjectDocument {
  _id?: string;
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  retentionDays: number;
  alertsEnabled: boolean;
  slackWebhook?: string;
  emailNotifications?: boolean;
}
