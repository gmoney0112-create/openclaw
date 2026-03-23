$ErrorActionPreference = "Stop"
$env:NODE_OPTIONS = if ($env:NODE_OPTIONS) { $env:NODE_OPTIONS } else { "--max-old-space-size=768" }
npm install
