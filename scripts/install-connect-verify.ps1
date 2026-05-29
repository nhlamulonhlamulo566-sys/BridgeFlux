<#
.SYNOPSIS
  Install BridgeFlux CLI stub, connect a local port, and perform basic verification.

.DESCRIPTION
  This script downloads the installer from the live app, installs the CLI shim, runs the
  `bridgeflux connect` command with the provided parameters, tails the local stub log, and
  opens the Active Tunnels page in the default browser for manual verification.

.PARAMETER Port
  Local port to advertise (default: 3000).

.PARAMETER Token
  BridgeFlux token (default: BF_GUEST_KEY). Should match a `tunnels.userId` in Firestore.

.PARAMETER Base
  App origin to use for cloud notifications (default: https://bridge-flux.vercel.app).

.PARAMETER Daemon
  When specified, pass `--daemon` to `bridgeflux connect`.

.EXAMPLE
  .\install-connect-verify.ps1 -Port 3000 -Token bf_live_guest_0xabc -Base https://bridge-flux.vercel.app -Daemon
#>

[CmdletBinding()]
param(
    [int]$Port = 3000,
    [string]$Token = 'BF_GUEST_KEY',
    [string]$Base = 'https://bridge-flux.vercel.app',
    [switch]$Daemon
)

function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red }

try {
    Write-Info "Using base: $Base"

    # Download install script
    $tmp = Join-Path $env:TEMP "bridgeflux-install.ps1"
    Write-Info "Downloading installer to $tmp"
    Invoke-WebRequest -Uri "$Base/install.ps1" -OutFile $tmp -UseBasicParsing -ErrorAction Stop

    Write-Info "Running installer (may require elevation)"
    & $tmp -base $Base

    # Build connect args
    $argsList = @('connect','--port',$Port.ToString(),'--token',$Token,'--base',$Base)
    if ($Daemon) { $argsList += '--daemon' }

    # Locate bridgeflux command
    $cmdPath = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\bridgeflux.cmd'
    if (Test-Path $cmdPath) {
        Write-Info "Found shim at $cmdPath. Executing connect..."
        & $cmdPath @argsList
    } elseif (Get-Command bridgeflux -ErrorAction SilentlyContinue) {
        Write-Info "Found bridgeflux in PATH. Executing connect..."
        bridgeflux @argsList
    } else {
        Write-Warn "bridgeflux command not found. Ensure the installer succeeded and PATH includes the shim." 
        exit 2
    }

    Start-Sleep -Seconds 2

    # Tail the local stub log
    $logPath = Join-Path $env:USERPROFILE '.bridgeflux\bridgeflux.log'
    if (Test-Path $logPath) {
        Write-Info "Showing last 30 lines of local CLI log: $logPath"
        Get-Content $logPath -Tail 30 | ForEach-Object { Write-Host $_ }
    } else {
        Write-Warn "Local log not found at $logPath"
    }

    # Open the Active Tunnels UI for manual verification
    $tunnelsUrl = "$Base/tunnels"
    Write-Info "Opening UI for manual verification: $tunnelsUrl"
    Start-Process $tunnelsUrl

    Write-Info "Done. If the UI does not reflect a LIVE state, check the tunnel document in Firestore or redeploy the app if necessary."
    exit 0
} catch {
    Write-Err "$($_.Exception.Message)"
    exit 1
}
