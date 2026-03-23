param(
  [switch]$CheckBuildPrereqs
)

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

function Invoke-BuildPrereqCheck {
  param(
    [string]$ServiceName,
    [string]$WorkingDir
  )

  $packageJsonPath = Join-Path $WorkingDir "package.json"
  if (-not (Test-Path $packageJsonPath)) {
    Write-Host "  [$ServiceName] No package.json found; skipping build check."
    return
  }

  $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
  $mainEntry = if ($packageJson.main) { [string]$packageJson.main } else { "dist/main.js" }
  $mainPath = Join-Path $WorkingDir $mainEntry

  if (Test-Path $mainPath) {
    Write-Host "  [$ServiceName] Build artifact present: $mainEntry"
    return
  }

  $hasBuildScript = $packageJson.scripts -and ($packageJson.scripts.PSObject.Properties.Name -contains "build")
  if (-not $hasBuildScript) {
    Write-Host "  [$ServiceName] Missing artifact ($mainEntry) and no build script; continuing without build."
    return
  }

  $nodeModulesPath = Join-Path $WorkingDir "node_modules"
  if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "  [$ServiceName] node_modules missing. Running npm install --ignore-scripts..."
    Push-Location $WorkingDir
    try {
      & npm.cmd install --ignore-scripts
    } catch {
      Write-Warning "[$ServiceName] npm install failed: $($_.Exception.Message)"
      return
    } finally {
      Pop-Location
    }
  }

  Write-Host "  [$ServiceName] Missing artifact ($mainEntry). Running npm run build..."
  Push-Location $WorkingDir
  try {
    & npm.cmd run build
  } catch {
    Write-Warning "[$ServiceName] npm run build failed: $($_.Exception.Message)"
  } finally {
    Pop-Location
  }
}

foreach ($service in $services) {
  $workingDir = Join-Path $repoRoot $service.Path
  $stdoutPath = Join-Path $logDir "$($service.Name).out.log"
  $stderrPath = Join-Path $logDir "$($service.Name).err.log"
  $pidPath = Join-Path $logDir "$($service.Name).pid"

  if (Test-Path $pidPath) {
    Remove-Item -Path $pidPath -Force -ErrorAction SilentlyContinue
  }

  if ($CheckBuildPrereqs) {
    Invoke-BuildPrereqCheck -ServiceName $service.Name -WorkingDir $workingDir
  }

  Write-Host "Starting $($service.Name) on port $($service.Port)..."
  $process = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "start" `
    -WorkingDirectory $workingDir `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden `
    -PassThru

  $process.Id | Out-File -FilePath $pidPath -Encoding ascii -NoNewline
  Write-Host "  PID $($process.Id) -> $pidPath"
}

Write-Host ""
Write-Host "All service start commands launched."
Write-Host "Logs: $logDir"
Write-Host "Next: run .\scripts\health-super-upgrade-local.ps1"
