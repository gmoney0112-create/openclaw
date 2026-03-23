import type { Browser, BrowserContext, Page } from "playwright";

export type BrowserClusterConfig = {
  port: number;
  maxInstances: number;
  headless: boolean;
  timeout: number;
  proxyList: string[];
};

export type BrowserActionName =
  | "click"
  | "fill_form"
  | "screenshot"
  | "scrape_data"
  | "download_file"
  | "upload_file"
  | "login_session";

export type BrowserSession = {
  id: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  proxy?: string;
  createdAt: string;
  lastUsedAt: string;
};

export type BrowserPoolStats = {
  maxInstances: number;
  activeSessions: number;
  availableSlots: number;
  sessions: Array<{
    id: string;
    proxy?: string;
    createdAt: string;
    lastUsedAt: string;
  }>;
};

export type OpenSessionRequest = {
  sessionId?: string;
  url?: string;
};

export type BrowserActionRequest = {
  sessionId: string;
  action: BrowserActionName;
  params?: Record<string, unknown>;
};

export type BrowserScrapeRequest = {
  sessionId: string;
  selector: string;
  attribute?: string;
};
