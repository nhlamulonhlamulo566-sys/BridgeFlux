<#
Install and activate BridgeFlux agent on Windows (elevated)

Usage (run in an elevated PowerShell prompt):
  .\install-windows.ps1 -BaseUrl "http://localhost:9002" -Port 3000 -Token "bf_live_guest_0x..." -AutoStart

Parameters:
  -BaseUrl : URL hosting the installer (default: http://localhost:9002)
  -Port    : Port to expose (default: 3000)
  -Token   : BridgeFlux session token (required)
  -AutoStart : If present, install as a system service (automatic startup)
#>

param(
  [string]$BaseUrl = "http://localhost:9002",
  [int]$Port = 3000,
  [string]$Token = "",
  [switch]$AutoStart
)

function Ensure-Admin {
  $current = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
  if (-not $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Not running as Administrator. Relaunching as Administrator..."
    $argList = @(
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      "`"$PSCommandPath`"",
      "-BaseUrl",
      "`"$BaseUrl`"",
      "-Port",
      "$Port",
      "-Token",
      "`"$Token`""
    )
    if ($AutoStart.IsPresent) { $argList += "-AutoStart" }
    Start-Process -FilePath powershell.exe -ArgumentList $argList -Verb RunAs
    exit
  }
}

Ensure-Admin

Write-Host "Downloading and executing remote installer from $BaseUrl/install.ps1"
try {
  iex (iwr -UseBasicParsing "$BaseUrl/install.ps1")
} catch {
  Write-Error "Failed to download or run install.ps1: $_"
  exit 1
}

Start-Sleep -Seconds 2

if ($AutoStart.IsPresent) {
  Write-Host "Installing agent as a system service (automatic startup)..."
  try {
    Start-Process powershell.exe -ArgumentList "-NoProfile","-Command","bridgeflux service install --port $Port --token $Token --startup automatic" -Verb RunAs -Wait
  } catch {
    Write-Error "Failed to install service: $_"
    exit 1
  }
} else {
  Write-Host "Starting bridgeflux connect (foreground)..."
  try {
    Start-Process -FilePath 'bridgeflux' -ArgumentList "connect","--port","$Port","--token","$Token" -NoNewWindow -Wait
  } catch {
    Write-Error "Failed to start bridgeflux: $_"
    exit 1
  }
}

Write-Host "BridgeFlux install/connect completed."
