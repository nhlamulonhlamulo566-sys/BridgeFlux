param(
  [string]$base = "http://localhost:9002"
)

if (-not $base) {
  Write-Host "Usage: iwr -useb <host>/install.ps1 | iex"
  exit 1
}

$installDir = Join-Path $env:LOCALAPPDATA "BridgeFlux"
if (-not (Test-Path $installDir)) {
  New-Item -ItemType Directory -Path $installDir | Out-Null
}

$bridgefluxUrl = "$base/bridgeflux.js"
$bridgefluxPath = Join-Path $installDir "bridgeflux.js"

Invoke-WebRequest -UseBasicParsing -Uri $bridgefluxUrl -OutFile $bridgefluxPath

$cmdPath = "C:\Windows\System32\bridgeflux.cmd"
$cmdContents = "@echo off`nnode `"$bridgefluxPath`" %*"

try {
  Set-Content -Path $cmdPath -Value $cmdContents -Force -Encoding ASCII -ErrorAction Stop
  Write-Host "Installed BridgeFlux CLI stub to $cmdPath"
} catch {
  $fallbackDir = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"
  if (-not (Test-Path $fallbackDir)) {
    New-Item -ItemType Directory -Path $fallbackDir | Out-Null
  }
  $cmdPath = Join-Path $fallbackDir "bridgeflux.cmd"
  Set-Content -Path $cmdPath -Value $cmdContents -Force -Encoding ASCII -ErrorAction Stop
  Write-Host "Installed BridgeFlux CLI stub to $cmdPath"
  Write-Host "If this path is not in your PATH, reopen PowerShell or add $fallbackDir to your PATH."
}

Write-Host "Run: bridgeflux connect --port 3000 --token <token>"
