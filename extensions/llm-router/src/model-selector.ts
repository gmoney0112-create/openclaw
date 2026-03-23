import type { RouteSelection, RouterConfig, TaskType } from "./types.js";

export class ModelSelector {
  private readonly config: RouterConfig;

  public constructor(config: RouterConfig) {
    this.config = config;
  }

  public select(taskType: TaskType): RouteSelection {
    const route = this.config.routing[taskType];
    if (!route) {
      throw new Error(`No routing rule found for task type: ${taskType}`);
    }

    const fallbackRoute = this.config.routing[taskType].fallback === route.provider
      ? route
      : this.findFallbackRoute(route.fallback);

    return {
      task_type: taskType,
      provider: route.provider,
      model: route.model,
      fallback_provider: route.fallback,
      fallback_model: fallbackRoute.model
    };
  }

  private findFallbackRoute(provider: string) {
    const match = Object.values(this.config.routing).find((route) => route.provider === provider);
    if (!match) {
      throw new Error(`No fallback route found for provider: ${provider}`);
    }
    return match;
  }
}
