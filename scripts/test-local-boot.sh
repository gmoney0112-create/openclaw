#!/bin/bash
# Real local boot gate for bundled channel plugins.
#
# Why this exists: `node dist/entry.js --help` exits before the gateway's
# plugin-loading path runs, so it CANNOT catch bundled-channel load failures
# (wrong specifier resolution, jiti re-instantiation / OOM). This gate imports
# each built channel shim exactly as the gateway loader does, in an isolated
# process with a tight heap cap, and fails if any shim throws or OOMs.
#
# Run AFTER `pnpm build:docker`.
set -u

DIST_EXT="dist/extensions"
HEAP_CAP_MB="${BOOT_GATE_HEAP_MB:-512}"
TIMEOUT_S="${BOOT_GATE_TIMEOUT_S:-20}"

if [ ! -d "$DIST_EXT" ]; then
  echo "❌ $DIST_EXT missing — run 'pnpm build:docker' first"
  exit 1
fi

# Channel plugins (declare a "channels" array in their manifest) are the ones
# that go through defineChannel*Entry and the specifier-resolution path.
channels=$(grep -l '"channels"' "$DIST_EXT"/*/openclaw.plugin.json 2>/dev/null | xargs -n1 dirname | xargs -n1 basename | sort -u)

if [ -z "$channels" ]; then
  echo "❌ No channel plugins found under $DIST_EXT"
  exit 1
fi

echo "🔍 Boot gate: importing each channel shim (heap cap ${HEAP_CAP_MB}MB, timeout ${TIMEOUT_S}s)"
fail=0
for ch in $channels; do
  shim="$DIST_EXT/$ch/index.js"
  [ -f "$shim" ] || { echo "  ⚠️  $ch: no index.js (skipped)"; continue; }
  out=$(timeout "$TIMEOUT_S" node --max-old-space-size="$HEAP_CAP_MB" -e "
    import('./$shim')
      .then(m => { if (!m.default) throw new Error('no default export'); console.log('OK'); process.exit(0); })
      .catch(e => { console.error(e.message); process.exit(1); })
  " 2>&1)
  code=$?
  if [ $code -eq 0 ]; then
    echo "  ✅ $ch"
  else
    fail=1
    if [ $code -eq 124 ]; then
      echo "  ❌ $ch: TIMED OUT (possible hang/OOM)"
    else
      echo "  ❌ $ch: $(echo "$out" | grep -iE 'cannot find module|heap out of memory|no default|error' | head -1)"
    fi
  fi
done

if [ $fail -ne 0 ]; then
  echo "❌ Boot gate FAILED — at least one channel shim did not load"
  exit 1
fi
echo "✅ Boot gate passed — all channel shims load cleanly"
exit 0
