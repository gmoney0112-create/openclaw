// Shared process/runtime utilities for plugins. This is the public boundary for
// logger wiring, runtime env shims, and global verbose console helpers.

export type { RuntimeEnv } from "../runtime.js";
export { createNonExitingRuntime, defaultRuntime } from "../runtime.js";
export {
  danger,
  info,
  isVerbose,
  isYes,
  logVerbose,
  logVerboseConsole,
  setVerbose,
  setYes,
  shouldLogVerbose,
  success,
  warn,
} from "../globals.js";
export * from "../logging.js";
export { waitForAbortSignal } from "../infra/abort-signal.js";
export { registerUnhandledRejectionHandler } from "../infra/unhandled-rejections.js";
// Runtime env/utility shims consumed by bundled channel plugins (telegram, slack,
// discord, signal, ...). These are part of the runtime-env public boundary; without
// them the bundler leaves dangling references that throw ReferenceError once a
// channel actually starts (e.g. "isTruthyEnvValue is not defined").
export { isTruthyEnvValue } from "../infra/env.js";
export { isWSL2Sync } from "../infra/wsl.js";
export { computeBackoff, sleepWithAbort } from "../infra/backoff.js";
export { retryAsync } from "../infra/retry.js";
export { ensureGlobalUndiciEnvProxyDispatcher } from "../infra/net/undici-global-dispatcher.js";
export {
  formatDurationPrecise,
  formatDurationSeconds,
} from "../infra/format-time/format-duration.js";
