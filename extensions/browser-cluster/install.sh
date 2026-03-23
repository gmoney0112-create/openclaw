#!/usr/bin/env bash
set -euo pipefail

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
npm install
npx playwright install chromium

# PowerShell equivalent:
# $env:NODE_OPTIONS="--max-old-space-size=768"
# npm install
# npx playwright install chromium
