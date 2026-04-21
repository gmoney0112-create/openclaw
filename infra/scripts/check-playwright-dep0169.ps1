param(
  [string]$PythonExe = "python",
  [string]$CdpEndpoint = "http://127.0.0.1:9222"
)

$ErrorActionPreference = "Stop"

$oldNodeOptions = $env:NODE_OPTIONS
if ($oldNodeOptions) {
  $env:NODE_OPTIONS = "$oldNodeOptions --trace-deprecation"
} else {
  $env:NODE_OPTIONS = "--trace-deprecation"
}

$py = @"
import asyncio
from playwright.async_api import async_playwright

async def main():
  async with async_playwright() as p:
    b = await p.chromium.connect_over_cdp(r"$CdpEndpoint")
    await b.close()

asyncio.run(main())
"@

$output = $py | & $PythonExe - 2>&1 | Out-String
Write-Host $output.TrimEnd()

if ($output -match "\\[DEP0169\\]") {
  Write-Error "DEP0169 detected. Re-run workspace/infra/scripts/patch-playwright-url-api.ps1 and try again."
  exit 1
}

Write-Host "OK: No DEP0169 warnings detected."

