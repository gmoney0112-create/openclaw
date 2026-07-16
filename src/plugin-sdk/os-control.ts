// Compat surface: openclaw/plugin-sdk/os-control
// Provides stable types and registry for OS-level automation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported operating systems. */
export type OSPlatform = "macos" | "windows" | "linux";

/** Types of OS commands that can be executed. */
export type OSCommandType =
  | "run"
  | "open"
  | "click"
  | "type"
  | "screenshot"
  | "file-op"
  | "process-control";

/** Permissions required for OS command execution. */
export type OSPermissions = {
  /** Whether this command requires elevation/sudo privileges. */
  requiresElevation?: boolean;
  /** Whether user approval is required before execution. */
  requiresApproval?: boolean;
};

/** An OS-level command to execute. */
export type OSCommand = {
  /** Type of command to execute. */
  type: OSCommandType;
  /** Target platform (defaults to current platform). */
  platform?: OSPlatform;
  /** Command to run (for 'run' and 'process-control' types). */
  command?: string;
  /** Arguments to pass to the command. */
  args?: string[];
  /** File/directory path (for 'file-op' types). */
  path?: string;
  /** Text to type (for 'type' command). */
  text?: string;
  /** Coordinates for click operations. */
  coordinates?: [number, number];
  /** Permission requirements. */
  permissions?: OSPermissions;
  /** Timeout in milliseconds. */
  timeout?: number;
};

/** Result of executing an OS command. */
export type OSResult = {
  /** Whether the command succeeded. */
  success: boolean;
  /** Command output (stdout). */
  output?: string;
  /** Error message if the command failed. */
  error?: string;
  /** Screenshot data (for screenshot commands). */
  screenshot?: Buffer;
  /** Process ID (for process-control commands). */
  processId?: number;
  /** Execution time in milliseconds. */
  executionTime?: number;
};

/** A provider that executes OS-level commands. */
export type OSAutomationProvider = {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Platform this provider supports. */
  platform: OSPlatform;
  /** Check if a command can be executed by this provider. */
  canExecute: (cmd: OSCommand) => boolean;
  /** Execute an OS command. */
  execute: (cmd: OSCommand) => Promise<OSResult>;
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _registry = new Map<string, OSAutomationProvider>();

/** Register an OS automation provider. */
export function registerOSAutomationProvider(provider: OSAutomationProvider): void {
  _registry.set(provider.id, provider);
}

/** Retrieve a registered OS automation provider by ID. */
export function getOSAutomationProvider(id: string): OSAutomationProvider | null {
  return _registry.get(id) ?? null;
}

/** List all registered OS automation providers. */
export function listOSAutomationProviders(): OSAutomationProvider[] {
  return [..._registry.values()];
}

/** Get the provider for a specific platform. */
export function getProviderForPlatform(platform: OSPlatform): OSAutomationProvider | null {
  const providers = listOSAutomationProviders();
  return providers.find((p) => p.platform === platform) ?? null;
}
