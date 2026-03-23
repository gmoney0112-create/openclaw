export async function run(toolName, params) {
  if (toolName !== "analyze") {
    throw new Error(`Unsupported tool: ${toolName}`);
  }

  const url = String(params.url ?? "");
  return {
    url,
    score: 78,
    keywords: ["automation", "growth", "conversion"],
    backlinks: 12,
    notes: [`Browser cluster hook: ${process.env.BROWSER_CLUSTER_URL ?? "not-configured"}`]
  };
}
