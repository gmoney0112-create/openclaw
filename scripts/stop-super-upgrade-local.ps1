$ErrorActionPreference = "Continue"

$repoRoot = "C:\Users\gmone\.openclaw\workspace\_fork_main_clone"
$logDir = Join-Path $repoRoot "logs\super-upgrade"

$services = @(
  @{ Name = "browser-cluster"; Port = 3100 },
  @{ Name = "llm-router"; Port = 3101 },
  @{ Name = "memory-layer"; Port = 3102 },
  @{ Name = "workflow-engine"; Port = 3103 },
  @{ Name = "multi-agent"; Port = 3104 },
  @{ Name = "skill-loader"; Port = 3105 },
  @{ Name = "research-engine"; Port = 3106 },
  @{ Name = "os-controller"; Port = 3107 },
  @{ Name = "voice-operator"; Port = 3108 },
  @{ Name = "auto-coder"; Port = 3109 },
  @{ Name = "revenue-executor"; Port = 3110 }
)

if (-not (Test-Path $logDir)) {
  Write-Host "No log directory found at $logDir. Nothing to stop."
  exit 0
}

function Wait-ForExit {
  param(
    [int]$TargetProcessId,
    [int]$TimeoutMs = 5000
  )

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  while ($sw.ElapsedMilliseconds -lt $TimeoutMs) {
    if (-not (Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue)) {
      return $true
    }
    Start-Sleep -Milliseconds 250
  }
  return -not (Get-Process -Id $TargetProcessId -ErrorAction SilentlyContinue)
}

$summary = @()

foreach ($service in $services) {
  $pidPath = Join-Path $logDir "$($service.Name).pid"

  if (-not (Test-Path $pidPath)) {
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "no-pid"
      detail = "PID file not found"
    }
    continue
  }

  $rawPid = (Get-Content -Path $pidPath -Raw -ErrorAction SilentlyContinue).Trim()
  $pidValue = 0
  if (-not [int]::TryParse($rawPid, [ref]$pidValue)) {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "stale-pid"
      detail = "Invalid PID value removed"
    }
    continue
  }

  $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if (-not $proc) {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "stale-pid"
      detail = "Process not found; PID file removed"
    }
    continue
  }

  Write-Host "Stopping $($service.Name) (PID $pidValue) gracefully..."
  & taskkill.exe /PID $pidValue /T | Out-Null

  if (Wait-ForExit -TargetProcessId $pidValue -TimeoutMs 6000) {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "stopped"
      detail = "Graceful stop"
    }
    continue
  }

  Write-Host "Force killing $($service.Name) (PID $pidValue)..."
  & taskkill.exe /PID $pidValue /T /F | Out-Null

  if (Wait-ForExit -TargetProcessId $pidValue -TimeoutMs 4000) {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "stopped"
      detail = "Forced kill"
    }
  } else {
    $summary += [PSCustomObject]@{
      service = $service.Name
      port = $service.Port
      status = "error"
      detail = "Still running after forced kill"
    }
  }
}

Write-Host ""
$summary | Format-Table -AutoSize
