#!/bin/bash
# Regression guard: detects when the same symbol is re-exported from multiple plugin-sdk files.
# Prevents silent re-introduction of the mesh pattern after refactor.

set -e

PLUGIN_SDK_DIR="src/plugin-sdk"
TEMP_EXPORT_MAP=$(mktemp)
DUPLICATES=$(mktemp)

trap "rm -f $TEMP_EXPORT_MAP $DUPLICATES" EXIT

echo "🔍 Scanning for duplicate symbol re-exports in plugin-sdk..."

# Extract all re-export statements and count which symbols appear in multiple files
for file in "$PLUGIN_SDK_DIR"/*.ts; do
  filename=$(basename "$file")
  # Find all re-exports (lines that start with export and have 'from')
  grep "^export.*from" "$file" 2>/dev/null | while IFS= read -r line; do
    # Extract the symbols between { and }
    if [[ $line =~ \{([^}]+)\} ]]; then
      symbols="${BASH_REMATCH[1]}"
      # Split by comma and process each symbol
      IFS=',' read -ra sym_array <<< "$symbols"
      for sym in "${sym_array[@]}"; do
        # Clean up whitespace and type/default keywords
        sym_clean=$(echo "$sym" | sed 's/^ *//; s/ *$//; s/^type //; s/^default //')
        if [ ! -z "$sym_clean" ]; then
          echo "$sym_clean|$filename"
        fi
      done
    fi
  done
done > "$TEMP_EXPORT_MAP"

# Find symbols that appear in more than one file
cut -d'|' -f1 "$TEMP_EXPORT_MAP" | sort | uniq -c | awk '$1 > 1 {print $2}' > "$DUPLICATES"

if [ -s "$DUPLICATES" ]; then
  echo "❌ Found duplicate re-exports (mesh pattern detected):"
  dup_count=$(wc -l < "$DUPLICATES")
  while read -r symbol; do
    files_count=$(grep "^${symbol}|" "$TEMP_EXPORT_MAP" | wc -l)
    echo "  '$symbol' (exported from $files_count files)"
    grep "^${symbol}|" "$TEMP_EXPORT_MAP" | cut -d'|' -f2 | sort -u | sed 's/^/    /'
  done < "$DUPLICATES"
  echo ""
  echo "Found $dup_count duplicate symbols"
  exit 1
else
  echo "✅ No duplicate re-exports found (star pattern maintained)"
  exit 0
fi
