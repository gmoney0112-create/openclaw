import type { JSONSchemaType } from "ajv";
import type { SkillManifest } from "./types";

export const skillManifestSchema: JSONSchemaType<SkillManifest> = {
  type: "object",
  properties: {
    name: { type: "string" },
    version: { type: "string" },
    description: { type: "string" },
    author: { type: "string" },
    tools: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          parameters: {
            type: "object",
            required: [],
            additionalProperties: true
          }
        },
        required: ["name", "description", "parameters"],
        additionalProperties: false
      }
    },
    dependencies: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["name", "version", "description", "author", "tools", "dependencies"],
  additionalProperties: false
};
