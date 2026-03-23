import { chromium, type BrowserContextOptions } from "playwright";
import { PlaywrightController } from "./playwright-controller.js";
import { ProxyRotator } from "./proxy-rotator.js";
import type {
  BrowserActionRequest,
  BrowserClusterConfig,
  BrowserPoolStats,
  BrowserScrapeRequest,
  BrowserSession
} from "./types.js";

export class BrowserPoolManager {
  private readonly config: BrowserClusterConfig;
  private readonly controller = new PlaywrightController();
  private readonly sessions = new Map<string, BrowserSession>();
  private readonly sessionProxyMap = new Map<string, string>();
  private readonly proxyRotator: ProxyRotator;

  public constructor(config: BrowserClusterConfig) {
    this.config = config;
    this.proxyRotator = new ProxyRotator(config.proxyList);
  }

  public async openSession(sessionId?: string, url?: string): Promise<{ sessionId: string; proxy?: string; page?: { url: string; title: string } }> {
    const id = sessionId ?? crypto.randomUUID();
    let session = this.sessions.get(id);

    if (!session) {
      if (this.sessions.size >= this.config.maxInstances) {
        throw new Error(`Browser pool exhausted. Max instances: ${this.config.maxInstances}`);
      }

      const proxy = this.proxyRotator.assign(id, this.sessionProxyMap);
      const launchOptions: BrowserContextOptions = {};
      const browser = await chromium.launch({
        headless: this.config.headless,
        proxy: proxy ? { server: proxy } : undefined
      });
      const context = await browser.newContext(launchOptions);
      const page = await context.newPage();
      const now = new Date().toISOString();
      session = {
        id,
        browser,
        context,
        page,
        proxy,
        createdAt: now,
        lastUsedAt: now
      };
      this.sessions.set(id, session);
    }

    session.lastUsedAt = new Date().toISOString();
    const result = url ? await this.controller.openUrl(session.page, url, this.config.timeout) : undefined;
    return {
      sessionId: id,
      proxy: session.proxy,
      page: result
    };
  }

  public async runAction(request: BrowserActionRequest): Promise<unknown> {
    const session = this.requireSession(request.sessionId);
    session.lastUsedAt = new Date().toISOString();
    const params = request.params ?? {};

    switch (request.action) {
      case "click":
        return this.controller.click(session.page, this.requireString(params.selector, "selector"), this.config.timeout);
      case "fill_form":
        return this.controller.fillForm(
          session.page,
          this.requireFields(params.fields),
          this.config.timeout
        );
      case "screenshot":
        return this.controller.screenshot(session.page);
      case "scrape_data":
        return this.controller.scrapeData(
          session.page,
          this.requireString(params.selector, "selector"),
          this.optionalString(params.attribute)
        );
      case "download_file":
        return this.controller.downloadFile(session.page, this.requireString(params.url, "url"), this.config.timeout);
      case "upload_file":
        return this.controller.uploadFile(
          session.page,
          this.requireString(params.selector, "selector"),
          this.requireString(params.filePath, "filePath"),
          this.config.timeout
        );
      case "login_session":
        return this.controller.loginSession(
          session.page,
          {
            url: this.requireString(params.url, "url"),
            usernameSelector: this.requireString(params.usernameSelector, "usernameSelector"),
            passwordSelector: this.requireString(params.passwordSelector, "passwordSelector"),
            submitSelector: this.requireString(params.submitSelector, "submitSelector"),
            username: this.requireString(params.username, "username"),
            password: this.requireString(params.password, "password")
          },
          this.config.timeout
        );
      default:
        throw new Error(`Unsupported action: ${request.action satisfies never}`);
    }
  }

  public async scrape(request: BrowserScrapeRequest): Promise<unknown> {
    const session = this.requireSession(request.sessionId);
    session.lastUsedAt = new Date().toISOString();
    return this.controller.scrapeData(session.page, request.selector, request.attribute);
  }

  public async deleteSession(sessionId: string): Promise<{ deleted: boolean; sessionId: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { deleted: false, sessionId };
    }

    await session.context.close();
    await session.browser.close();
    this.sessions.delete(sessionId);
    this.proxyRotator.release(sessionId, this.sessionProxyMap);
    return { deleted: true, sessionId };
  }

  public async shutdown(): Promise<void> {
    await Promise.all(Array.from(this.sessions.keys()).map((sessionId) => this.deleteSession(sessionId)));
  }

  public getHealth(): BrowserPoolStats {
    return {
      maxInstances: this.config.maxInstances,
      activeSessions: this.sessions.size,
      availableSlots: this.config.maxInstances - this.sessions.size,
      sessions: Array.from(this.sessions.values()).map((session) => ({
        id: session.id,
        proxy: session.proxy,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt
      }))
    };
  }

  private requireSession(sessionId: string): BrowserSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  private requireString(value: unknown, key: string): string {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`Expected non-empty string for ${key}`);
    }
    return value;
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private requireFields(value: unknown): Array<{ selector: string; value: string }> {
    if (!Array.isArray(value)) {
      throw new Error("Expected fields to be an array");
    }

    return value.map((field, index) => {
      if (typeof field !== "object" || field === null) {
        throw new Error(`Field at index ${index} must be an object`);
      }

      const record = field as Record<string, unknown>;
      return {
        selector: this.requireString(record.selector, `fields[${index}].selector`),
        value: this.requireString(record.value, `fields[${index}].value`)
      };
    });
  }
}
