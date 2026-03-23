export async function run(toolName, params) {
  if (toolName !== "generate") {
    throw new Error(`Unsupported tool: ${toolName}`);
  }

  const format = String(params.format ?? "blog");
  const topic = String(params.topic ?? "untitled");
  return {
    format,
    topic,
    draft: `${format.toUpperCase()} DRAFT: ${topic}`,
    router: process.env.LLM_ROUTER_URL ?? "not-configured"
  };
}
