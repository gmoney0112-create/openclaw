// Compat surface: openclaw/plugin-sdk/skills
// Provides stable types and registry for the skill marketplace system.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata describing a skill's input requirements. */
export type SkillInputSchema = Record<
  string,
  {
    type: string;
    description: string;
    required?: boolean;
    default?: unknown;
  }
>;

/** Metadata describing a skill's output structure. */
export type SkillOutputSchema = Record<
  string,
  {
    type: string;
    description: string;
  }
>;

/** Complete definition of a reusable skill. */
export type SkillDefinition = {
  /** Unique identifier for the skill. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Detailed description of what the skill does. */
  description: string;
  /** Semantic version (e.g., "1.0.0"). */
  version: string;
  /** Author or organization that created the skill. */
  author?: string;
  /** Input parameter schema. */
  inputs: SkillInputSchema;
  /** Output result schema. */
  outputs: SkillOutputSchema;
  /** Tags for categorization and discovery. */
  tags: string[];
  /** Additional metadata (e.g., examples, prerequisites). */
  metadata?: Record<string, unknown>;
};

/** A provider that manages a collection of executable skills. */
export type SkillProvider = {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable label for the provider. */
  label: string;
  /** List all available skills from this provider. */
  listSkills: () => Promise<SkillDefinition[]>;
  /** Retrieve a specific skill definition by ID. */
  getSkill: (skillId: string) => Promise<SkillDefinition | null>;
  /** Execute a skill with the given inputs. */
  executeSkill: (skillId: string, inputs: Record<string, unknown>) => Promise<unknown>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, SkillProvider>();

/** Register a skill provider. */
export function registerSkillProvider(provider: SkillProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered skill provider by ID. */
export function getSkillProvider(id: string): SkillProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered skill providers. */
export function listSkillProviders(): SkillProvider[] {
  return [..._registry.values()];
}

/** Retrieve all skills from all registered providers. */
export async function listAllSkills(): Promise<SkillDefinition[]> {
  const providers = listSkillProviders();
  const allSkills = await Promise.all(providers.map((p) => p.listSkills().catch(() => [])));
  return allSkills.flat();
}

/** Search skills by tags or name. */
export async function searchSkills(query: string): Promise<SkillDefinition[]> {
  const allSkills = await listAllSkills();
  const lowerQuery = query.toLowerCase();
  return allSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.description.toLowerCase().includes(lowerQuery) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}
