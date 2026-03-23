export class ProxyRotator {
  private readonly proxyList: string[];
  private nextIndex = 0;

  public constructor(proxyList: string[]) {
    this.proxyList = proxyList.filter(Boolean);
  }

  public assign(sessionId: string, activeProxyMap: Map<string, string>): string | undefined {
    if (activeProxyMap.has(sessionId)) {
      return activeProxyMap.get(sessionId);
    }

    if (this.proxyList.length === 0) {
      return undefined;
    }

    const inUse = new Set(activeProxyMap.values());
    for (let offset = 0; offset < this.proxyList.length; offset += 1) {
      const candidate = this.proxyList[(this.nextIndex + offset) % this.proxyList.length];
      if (!inUse.has(candidate)) {
        this.nextIndex = (this.nextIndex + offset + 1) % this.proxyList.length;
        activeProxyMap.set(sessionId, candidate);
        return candidate;
      }
    }

    const fallback = this.proxyList[this.nextIndex % this.proxyList.length];
    this.nextIndex = (this.nextIndex + 1) % this.proxyList.length;
    activeProxyMap.set(sessionId, fallback);
    return fallback;
  }

  public release(sessionId: string, activeProxyMap: Map<string, string>): void {
    activeProxyMap.delete(sessionId);
  }
}
