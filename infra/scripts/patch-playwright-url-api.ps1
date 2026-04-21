param(
  [string]$PythonExe = "python",
  [switch]$NoBackup
)

$ErrorActionPreference = "Stop"

function Get-PlaywrightDriverPackageRoot {
  param([string]$PythonExeParam)

  $cliJs = & $PythonExeParam -c "from playwright._impl._driver import compute_driver_executable; print(compute_driver_executable()[1])" 2>$null
  if (-not $cliJs) {
    throw "Failed to locate Playwright driver via '$PythonExeParam'. Is Playwright Python installed for this interpreter?"
  }

  $cliJs = $cliJs.Trim()
  if (-not (Test-Path -LiteralPath $cliJs)) {
    throw "Playwright driver cli.js not found at: $cliJs"
  }

  return (Split-Path -Parent $cliJs)
}

function Patch-PlaywrightUrlParse {
  param([string]$IndexJsPath)

  $content = Get-Content -Raw -LiteralPath $IndexJsPath

  $old = 'var xw=require("url").parse,'
  $new = 'var xw=function(i){try{var u=new URL(i);return{protocol:u.protocol,host:u.host,port:u.port}}catch{return{}}},'

  if ($content.Contains($new)) {
    Write-Host "Already patched: $IndexJsPath"
    return $false
  }

  if (-not $content.Contains($old)) {
    if ($content.Contains('require("url").parse') -or $content.Contains("require('url').parse")) {
      throw "Playwright bundle changed: found require('url').parse but not the expected 'var xw=require(""url"").parse,' anchor. Update patch script for the new version."
    }
    Write-Host "No legacy require('url').parse usage found in expected location. Nothing to patch."
    return $false
  }

  $patched = $content.Replace($old, $new)
  Set-Content -LiteralPath $IndexJsPath -Value $patched -Encoding utf8 -NoNewline
  Write-Host "Patched Playwright driver bundle: $IndexJsPath"
  return $true
}

$packageRoot = Get-PlaywrightDriverPackageRoot -PythonExeParam $PythonExe
$indexJs = Join-Path $packageRoot "lib\\utilsBundleImpl\\index.js"

if (-not (Test-Path -LiteralPath $indexJs)) {
  throw "Playwright driver bundle not found at: $indexJs"
}

if (-not $NoBackup) {
  $backup = "$indexJs.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Copy-Item -LiteralPath $indexJs -Destination $backup -Force
  Write-Host "Backup created: $backup"
}

[void](Patch-PlaywrightUrlParse -IndexJsPath $indexJs)

