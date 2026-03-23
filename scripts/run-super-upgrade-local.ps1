param(
  [switch]$CheckBuildPrereqs,
  [switch]$NoStop,
  [int]$WarmupSeconds = 10
)

$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\gmone\.openclaw\workspace\_fork_main_clone"
$startScript = Join-Path $repoRoot "scripts\start-super-upgrade-local.ps1"
$healthScript = Join-Path $repoRoot "scripts\health-super-upgrade-local.ps1"
$stopScript = Join-Path $repoRoot "scripts\stop-super-upgrade-local.ps1"

if (-not (Test-Path $startScript)) {
  throw "Missing start script: $startScript"
}
if (-not (Test-Path $healthScript)) {
  throw "Missing health script: $healthScript"
}
if (-not (Test-Path $stopScript)) {
  throw "Missing stop script: $stopScript"
}

Write-Host "Starting super-upgrade local stack..."
if ($CheckBuildPrereqs) {
  & powershell -ExecutionPolicy Bypass -File $startScript -CheckBuildPrereqs
} else {
  & powershell -ExecutionPolicy Bypass -File $startScript
}

if ($WarmupSeconds -gt 0) {
  Write-Host "Waiting $WarmupSeconds seconds for service warmup..."
  Start-Sleep -Seconds $WarmupSeconds
}

Write-Host "Running health sweep..."
& powershell -ExecutionPolicy Bypass -File $healthScript

if ($NoStop) {
  Write-Host "NoStop enabled; leaving services running."
  exit 0
}

Write-Host "Stopping super-upgrade local stack..."
& powershell -ExecutionPolicy Bypass -File $stopScript
