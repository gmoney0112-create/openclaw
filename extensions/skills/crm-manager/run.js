export async function run(toolName, params) {
  if (toolName !== "batch_upsert") {
    throw new Error(`Unsupported tool: ${toolName}`);
  }

  const contacts = Array.isArray(params.contacts) ? params.contacts : [];
  return {
    processed: contacts.length,
    contacts,
    workflow: process.env.WORKFLOW_ENGINE_URL ?? "not-configured"
  };
}
