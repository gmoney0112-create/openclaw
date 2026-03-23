export class CommandRouter {
  async route(text: string): Promise<Record<string, unknown>> {
    const command = text.replace(/^hey openclaw\s*/i, "").trim();
    return {
      command,
      multi_agent_url: process.env.MULTI_AGENT_URL ?? null,
      dispatched: command.length > 0
    };
  }
}
