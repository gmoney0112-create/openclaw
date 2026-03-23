$ErrorActionPreference = "Stop"

$repoRoot = "C:\Users\gmone\.openclaw\workspace\_fork_main_clone"
$services = @(
  @{ Name = "browser-cluster"; Path = "extensions\browser-cluster"; Port = 3100 },
  @{ Name = "llm-router"; Path = "extensions\llm-router"; Port = 3101 },
  @{ Name = "memory-layer"; Path = "extensions\memory-layer"; Port = 3102 },
  @{ Name = "workflow-engine"; Path = "extensions\workflow-engine"; Port = 3103 },
  @{ Name = "multi-agent"; Path = "extensions\multi-agent"; Port = 3104 },
  @{ Name = "skill-loader"; Path = "extensions\skill-loader"; Port = 3105 },
  @{ Name = "research-engine"; Path = "extensions\research-engine"; Port = 3106 },
  @{ Name = "os-controller"; Path = "extensions\os-controller"; Port = 3107 },
  @{ Name = "voice-operator"; Path = "extensions\voice-operator"; Port = 3108 },
  @{ Name = "auto-coder"; Path = "extensions\auto-coder"; Port = 3109 },
  @{ Name = "revenue-executor"; Path = "extensions\revenue-executor"; Port = 3110 }
)

$logDir = Join-Path $repoRoot "logs\super-upgrade"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

foreach ($service in $services) {
  $workingDir = Join-Path $repoRoot $service.Path
  $stdoutPath = Join-Path $logDir "$($service.Name).out.log"
  $stderrPath = Join-Path $logDir "$($service.Name).err.log"

  Write-Host "Starting $($service.Name) on port $($service.Port)..."
  Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "start" `
    -WorkingDirectory $workingDir `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden | Out-Null
}

Write-Host ""
Write-Host "All service start commands launched."
Write-Host "Logs: $logDir"
Write-Host "Next: run .\scripts\health-super-upgrade-local.ps1"
