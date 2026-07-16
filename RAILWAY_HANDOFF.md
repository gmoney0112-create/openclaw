# Railway OpenClaw Deployment — Handoff

_Last updated: 2026-07-16, end of session. Written for a fresh Claude Code session with Railway MCP access to pick up immediately._

## TL;DR

The app is **deployed and running successfully** on Railway. Core functionality (gateway, all messaging channels, Anthropic/OpenAI/Google chat models) works. Remaining work is optional polish: ~10 non-fatal provider-plugin warnings (video/music generation, memory embedding, realtime transcription) and one security check (gateway auth token). Nothing here is currently broken or blocking.

## 1. Where things live

- **Repo:** `gmoney0112-create/openclaw` (fork of `openclaw/openclaw`)
- **Branch:** `claude/railway-openclaw-fixes-o4ghyn` — this is the deployed branch. All work described below is committed and pushed here.
- **Latest commit:** `7334aad` (`fix(docker): rewrite git@github.com: SSH URLs to HTTPS in the build stage`)
- **Railway project:** `successful-wholeness` — project ID `afb50a72-9930-4c51-b292-36e44cc6e953`
- **Railway environment:** `production` — environment ID `b5502065-da8a-4dc8-82d3-38a3a705e738`
- **Railway service:** `openclaw` — service ID `bf357c38-655e-4da3-aad3-4c6fbd8e50aa`
- **Dashboard link:** https://railway.com/project/afb50a72-9930-4c51-b292-36e44cc6e953?environmentId=b5502065-da8a-4dc8-82d3-38a3a705e738
- **Public URL:** `openclaw-production-56fa.up.railway.app`
- **Build:** Dockerfile-based (Railway auto-detects `Dockerfile` at repo root; the `railway.json`'s `deploy.startCommand` sets the actual gateway start command, but build uses the Dockerfile's own `CMD`/build steps)

## 2. Current deployment status (as of last verified check)

- Latest deploy: **SUCCESS**
- Gateway: running, listening on `ws://0.0.0.0:8080`, heartbeat + health-monitor active, no crash-looping
- Health check: passing (`/healthz`, 300s interval per Dockerfile `HEALTHCHECK`)
- Agent model: `claude-opus-4-6` (per last observed runtime log)
- **Security warning logged at startup:** _"binding to a non-loopback address — ensure authentication is configured before exposing to public networks."_ — **verify `OPENCLAW_GATEWAY_TOKEN` (or equivalent) is set in Railway Variables before sharing this URL anywhere.** This is the single most important unverified item.

## 3. What was broken and fixed this session (in order)

The starting point: the CLI crashed immediately on startup with `ReferenceError: <name> is not defined` — a cascading chain of missing/broken exports in the `plugin-sdk` facade layer (`src/plugin-sdk/*.ts`), which re-exports internals of `src/**` for use by `extensions/*`. Every extension imports exclusively through `openclaw/plugin-sdk/<subpath>`; when a subpath facade doesn't actually export something an extension imports, esbuild/rolldown only warns at build time (`[MISSING_EXPORT]`, non-fatal) but the bundled code throws at runtime the first time that name is referenced.

### 3a. plugin-sdk facade fixes (~20 commits)

Methodology used: for each `ReferenceError: X is not defined`, `grep` for `X` across `src/` and `extensions/`. Two patterns kept recurring:

1. **Wrong re-export path** — the real implementation existed in `src/**`, but the plugin-sdk subpath file either didn't export it at all, or re-exported it from the wrong module (e.g. a generic `channel-config-schema.ts` was wrongly asked to export a per-channel `TelegramConfigSchema`/`SignalConfigSchema`/etc. that only exists in `config/zod-schema.providers-core.js`). Fix: correct the re-export source.
2. **Genuinely unimplemented function** — referenced by extensions but never written anywhere in `src/`. Fix: implement it, inferring the exact signature/behavior from how every call site uses it (usually 3-10 extensions call the same helper identically, which pins down the contract precisely).

Notable implementations added (not just re-export fixes):

- `adaptScopedAccountAccessor`, `createRestrictSendersChannelSecurity`, `createChatChannelPlugin` (the big one — merges a channel plugin's `base` shape with `pairing.text`/`outbound.{base,attachedResults}` shorthand into full adapters, used by 20+ channels), `createComputedAccountStatusAdapter` + async variant, `createChannelDirectoryAdapter`, `createDangerousNameMatchingMutableAllowlistWarningCollector`, `resolveGlobalDedupeCache`, `createClaimableDedupe` (+ added a `forget()` method to the existing `PersistentDedupe` type to support it), the full chat-target-prefix-parsing family in `src/plugin-sdk/channel-targets.ts` (`parseChatTargetPrefixesOrThrow`, `parseChatAllowTargetPrefixes`, `resolveServicePrefixedChatTarget`, `resolveServicePrefixedTarget`, `resolveServicePrefixedAllowTarget`, `resolveServicePrefixedOrChatAllowTarget`, `createAllowedChatSenderMatcher`), generic string helpers (`normalizeOptionalString`, `normalizeLowercaseStringOrEmpty`, `normalizeOptionalLowercaseString`, `readStringValue`, `readStringField`, `asOptionalRecord` in `src/shared/string-normalization.ts`), `createModelCatalogPresetAppliers` + `createDefaultModelsPresetAppliers` (provider onboarding preset factories, siblings of the earlier `createDefaultModelPresetAppliers`), and **`registerCliBackend`** — a brand-new plugin-API capability wired end-to-end (type in `src/plugin-sdk/cli-backend.ts` already existed; added the registry plumbing in `src/plugins/registry.ts`, `registry-empty.ts`, `loader.ts`, `types.ts` following the exact pattern already used for `registerSpeechProvider`/`registerImageGenerationProvider`/etc).

**Why `registerCliBackend` mattered most:** Anthropic's plugin `register()` function called `api.registerCliBackend(...)` as its _first_ line, before `api.registerProvider(...)`. Since the method didn't exist, it threw immediately and **Anthropic never registered any models at all** — same story for OpenAI and Google, which also call `registerCliBackend` early. Implementing this one function unblocked all three primary LLM providers' core model registration.

Full commit-by-commit detail is in `git log claude/railway-openclaw-fixes-o4ghyn` — every commit message documents the specific root cause and fix.

### 3b. Docker/dependency build fixes (the deploy-log debugging chain)

These surfaced only once the app itself worked and Railway attempted a real Docker build:

1. **`CI=false` breaking `pnpm prune --prod`** (commit `477d08e`): A Railway auto-fix bot (`railway-app[bot]`) had already auto-committed and auto-merged two PRs directly onto this branch in response to earlier failures (commits `8551ebe`, `193c2fb`) — its last "fix" literally set `RUN CI=false pnpm prune --prod`, the opposite of correct, causing `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Fixed by using a durable `ENV CI=true` Dockerfile instruction instead of an inline prefix (inline prefixes can be shadowed; `ENV` persists for the whole stage). **Watch for this bot re-appearing** — if a future deploy fails, it may auto-open and auto-merge another "fix" PR to this branch without asking. Check the repo's merged-PR list if something looks like it changed underneath you.

2. **Stale lockfile / missing workspace package** (commit `b4e4606`): `extensions/acpx/package.json` referenced `@openclaw/plugin-sdk@workspace:*` and `acpx@0.5.3`, but `pnpm-lock.yaml` still had `acpx@0.3.0` and no `plugin-sdk` workspace entry — `--frozen-lockfile` install failed with `ERR_PNPM_OUTDATED_LOCKFILE`. Root cause: a **different, already-merged fix on `main`** (commit `81d9a3a`, not this branch) had already solved this exact problem by adding `packages/plugin-sdk/package.json`, but this branch diverged from an earlier point and never got it. Ported that file and ran `pnpm install` to regenerate the lockfile.

3. **SSH git-protocol dependency failure** (commits `f3c0b7d`, `7334aad` — **the trickiest one**): `pnpm-lock.yaml` records `@whiskeysockets/baileys`'s dependency on `libsignal` with a resolved identity of `git@github.com:whiskeysockets/libsignal-node.git` (SSH form). Railway's build container has no SSH keys, so `git clone git@github.com:...` fails with `Host key verification failed`.
   - First attempt: `pnpm.overrides` in `package.json` (both bare `"libsignal"` and scoped `"@whiskeysockets/baileys>libsignal"`) — **does not work**. pnpm's override mechanism appears to no-op for git-protocol dependency specifiers.
   - Second attempt: `pnpm.packageExtensions` patching baileys' own manifest — locally appeared to work, but this was a **false positive**: with `--frozen-lockfile`, pnpm skips the resolution step entirely ("Lockfile is up to date, resolution step is skipped") and fetches directly from whatever `resolution.repo` is already baked into the lockfile, which pnpm's git resolver _always_ normalizes to the SSH-style string for this repo regardless of input spec. `packageExtensions` only affects resolution, which never runs with a frozen lockfile.
   - **Actual fix** (commit `7334aad`): added `RUN git config --global url."https://github.com/".insteadOf "git@github.com:"` to the Dockerfile's `build` stage, before the `pnpm install --frozen-lockfile` step. This rewrites the SSH URL to HTTPS at the git-CLI level, below pnpm, so no SSH keys are ever needed for this public repo.
   - **Important caveat, unresolved:** this exact fix **could not be verified end-to-end locally**, because the sandbox this session ran in has its own git config that already auto-rewrites `git@github.com:` → HTTPS transparently (a proxy-compatibility feature of the Claude Code environment itself), which is exactly what made the `packageExtensions` "fix" look like it worked in testing when it actually didn't. **If a fresh session tests this Dockerfile fix locally in a similarly-configured sandbox, it will falsely appear to work whether or not the fix is actually present** — the only real test is an actual Railway build. The last known deploy did proceed past this step (per the user's "I believe it working" + the follow-up successful-deployment report), but this should be double-checked by reading the actual next build log's "Build → Build image" step if any doubt remains.

## 4. Known remaining issues (non-fatal — app runs fine despite these)

On every startup, these plugins fail to register with a `[plugins]` warning and are skipped; everything else continues normally:

| Extension                                     | Error                                                                                 | Root cause                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `alibaba`                                     | `DASHSCOPE_WAN_VIDEO_MODELS is not iterable`                                          | Model list constant never implemented in `src/plugin-sdk/video-generation.ts`                                |
| `byteplus`, `fal`, `runway`, `vydra`          | `api.registerVideoGenerationProvider is not a function`                               | Whole video-generation plugin-API capability never wired (no type, no registry, no method)                   |
| `comfy`, `minimax`, `google` (music-gen only) | `api.registerMusicGenerationProvider is not a function`                               | Same — music-generation capability never wired                                                               |
| `ollama`                                      | `api.registerMemoryEmbeddingProvider is not a function`                               | Memory-embedding provider capability never wired                                                             |
| `openai` (transcription only)                 | `api.registerRealtimeTranscriptionProvider is not a function`                         | Realtime-transcription capability never wired                                                                |
| `volcengine`                                  | `VOLC_SHARED_CODING_MODEL_CATALOG is not iterable`                                    | Same class of issue as alibaba — a model catalog constant was never implemented                              |
| `memory-core`                                 | `Cannot find module '.../dist/plugin-sdk/root-alias.cjs/memory-core-host-engine-qmd'` | Missing native binary/build artifact — this is a packaging/build issue, not an export bug. Not investigated. |

**Important: none of these block Anthropic, OpenAI (chat), Google (chat), or any messaging channel.** Each of these extensions' _core_ registration (if any) happens before the failing call in every case I checked (e.g. Google's actual Gemini model provider registers fine; only its music-gen sub-feature fails afterward). Confirmed by reading each extension's `index.ts` and checking the order of `api.register*` calls relative to the one that throws.

If someone wants to fix these next, the pattern from `registerCliBackend` is the template: 4 files to touch (`src/plugins/types.ts` for the `OpenClawPluginApi` method signature, `src/plugins/registry.ts` for the actual registration function + wiring into `createApi`, `src/plugins/registry-empty.ts` + `loader.ts` for the new registry array / `PluginRecord` field). The hard part isn't the plumbing — it's that `VideoGenerationProvider`/`MusicGenerationProvider`/`MemoryEmbeddingProvider` types would need to be defined from scratch by reverse-engineering what each of ~7 extensions expects (DashScope, ComfyUI, Runway, MiniMax, BytePlus, Ollama APIs), which risks encoding wrong/unverified behavior against real external APIs. Treat as a separate, lower-priority effort — get explicit sign-off before implementing speculative business logic against those providers.

## 5. Recommended next steps, in priority order

1. **Verify the gateway auth token is actually set** (Railway → openclaw service → Variables tab → look for `OPENCLAW_GATEWAY_TOKEN` or check `openclaw config get` via a Railway shell). This is a real security gap if unset, since the gateway binds to a non-loopback address.
2. **Confirm the latest deploy (commit `7334aad` or later) is the one actually live** — check Railway dashboard deployment history matches `git log` HEAD on this branch. If Railway's `railway-app[bot]` auto-fixer intervened again, there may be additional commits on the remote branch beyond what's summarized here; `git fetch && git log HEAD..origin/claude/railway-openclaw-fixes-o4ghyn` will show them.
3. **Watch for `railway-app[bot]` activity** — check `gh pr list` / GitHub notifications for this repo periodically. If a build fails for any reason, this bot may auto-open and auto-merge a "fix" PR without human review, and its past two attempts were both wrong (see §3b.1). Treat any bot-authored commit on this branch with suspicion — verify before trusting.
4. **Optional:** fix the ~10 remaining non-fatal provider warnings (§4), starting with whichever the user actually wants to use (e.g. if they want image/video generation via `fal` or `runway`, that's the one to prioritize; if not, leave as-is).
5. **Optional:** investigate `memory-core`'s missing native module — this needs a build-side fix (`packages/plugin-sdk`-style missing artifact), not a code fix, and wasn't investigated this session at all.

## 6. How to verify locally before pushing further changes

```bash
cd /path/to/openclaw
git checkout claude/railway-openclaw-fixes-o4ghyn
pnpm install
pnpm build:docker          # should exit 0; MISSING_EXPORT warnings are expected/non-fatal (~800 of them, all in extensions not on the critical path)
timeout 10 node dist/entry.js help   # should print the full CLI help with only the §4 plugin warnings above, then exit
```

To test the Docker build specifically (only reliable way to validate the git/CI fixes, since this sandbox's own git config masks the SSH issue — see §3b.3):

```bash
docker build -t openclaw-test .    # requires a working Docker daemon, which this sandbox did NOT have
```

If no Docker daemon is available, the only real signal is Railway's own build log.

## 7. Files most relevant to this work

- `src/plugin-sdk/*.ts` — the facade layer; almost every fix this session touched one of these
- `src/plugins/registry.ts`, `registry-empty.ts`, `loader.ts`, `types.ts` — core plugin registration system (where `registerCliBackend` was added; where the video/music/embedding/transcription methods would go next)
- `Dockerfile` — the `CI=true` and git URL rewrite fixes are both here, in the `build` and `runtime-assets` stages
- `railway.json` — sets the gateway start command (`node openclaw.mjs gateway --allow-unconfigured --bind lan --port 8080`, plus a one-time `config set` for `gateway.controlUi.allowedOrigins`); not touched this session but worth knowing it exists
- `packages/plugin-sdk/package.json` — newly added, workspace-only package satisfying `extensions/acpx`'s `devDependency`
- `package.json` (`pnpm.overrides`, `pnpm.packageExtensions`) — has a leftover `packageExtensions` entry for baileys/libsignal that turned out not to be the actual fix (see §3b.3) but is harmless to leave in place (it would help in a non-frozen-lockfile install scenario)
