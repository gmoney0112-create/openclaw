export async function run(toolName, params) {
  if (toolName !== "scrape") {
    throw new Error(`Unsupported tool: ${toolName}`);
  }

  const niche = String(params.niche ?? "");
  const location = String(params.location ?? "");
  return {
    niche,
    location,
    leads: [
      { name: `${niche} Lead 1`, location, source: "google-maps" },
      { name: `${niche} Lead 2`, location, source: "linkedin" },
      { name: `${niche} Lead 3`, location, source: "directory" }
    ]
  };
}
