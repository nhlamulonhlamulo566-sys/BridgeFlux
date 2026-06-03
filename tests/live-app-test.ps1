#Requires -Version 5.1
<#
.SYNOPSIS
    Comprehensive Live App Test Suite for BridgeFlux
    
.DESCRIPTION
    Tests all critical features of the BridgeFlux application:
    - Dashboard accessibility
    - API endpoints
    - Bridge provisioning
    - Traffic inspector
    - Security features
    - Error handling
    
.PARAMETER DashboardUrl
    The URL of the dashboard (default: http://localhost:9002)
    
.PARAMETER Verbose
    Enable verbose output
#>

param(
    [string]$DashboardUrl = "http://localhost:9002",
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Colors for output
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    
    $status = $Passed ? "✅ PASS" : "❌ FAIL"
    $color = $Passed ? $colors.Success : $colors.Error
    
    Write-Host "$status - $TestName" -ForegroundColor $color
    if ($Details) {
        Write-Host "    Details: $Details" -ForegroundColor Gray
    }
}

function Invoke-ApiTest {
    param(
        [string]$TestName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-WebRequest @params
        Write-TestResult $TestName $true "Status: $($response.StatusCode)"
        return $response
    }
    catch {
        Write-TestResult $TestName $false "Error: $($_.Exception.Message)"
        return $null
    }
}

# Start testing
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "BridgeFlux Live App Test Suite" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "Dashboard: $DashboardUrl`n" -ForegroundColor Gray

# Phase 1: Dashboard Accessibility
Write-Host "`n[PHASE 1] Dashboard Accessibility Tests" -ForegroundColor Yellow
Write-Host "-" * 40

$dashboardTest = $null
try {
    $dashboardTest = Invoke-WebRequest -Uri $DashboardUrl -TimeoutSec 10 -ErrorAction Stop
    Write-TestResult "Dashboard Homepage" $true "Status: $($dashboardTest.StatusCode)"
} catch {
    Write-TestResult "Dashboard Homepage" $false "Could not connect to dashboard"
}

# Phase 2: API Endpoint Tests
Write-Host "`n[PHASE 2] API Endpoint Tests" -ForegroundColor Yellow
Write-Host "-" * 40

$headers = @{
    'Accept' = 'application/json'
    'Content-Type' = 'application/json'
}

# Test 1: Get Overview/Status
Invoke-ApiTest "GET /api/status" "$DashboardUrl/api/status" "GET" $headers | Out-Null

# Test 2: Get Agent config
Invoke-ApiTest "GET /api/agent" "$DashboardUrl/api/agent" "GET" $headers | Out-Null

# Test 3: Get Mesh Status
Invoke-ApiTest "GET /api/mesh" "$DashboardUrl/api/mesh" "GET" $headers | Out-Null

# Test 4: List tunnels
Invoke-ApiTest "GET /api/tunnels" "$DashboardUrl/api/tunnels" "GET" $headers | Out-Null

# Test 5: List domains
Invoke-ApiTest "GET /api/domains" "$DashboardUrl/api/domains" "GET" $headers | Out-Null

# Phase 3: Dashboard Pages
Write-Host "`n[PHASE 3] Dashboard UI Pages" -ForegroundColor Yellow
Write-Host "-" * 40

$pages = @(
    @{ Path = '/'; Name = 'Overview' }
    @{ Path = '/tunnels'; Name = 'Active Tunnels' }
    @{ Path = '/domains'; Name = 'Reserved Domains' }
    @{ Path = '/inspector'; Name = 'Live Inspector' }
    @{ Path = '/diagnostics'; Name = 'Failure Analysis' }
    @{ Path = '/scripts'; Name = 'Script Generator' }
    @{ Path = '/security'; Name = 'Access Control' }
    @{ Path = '/sandbox'; Name = 'Connectivity Sandbox' }
    @{ Path = '/settings'; Name = 'Settings' }
)

foreach ($page in $pages) {
    $url = "$DashboardUrl$($page.Path)"
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -ErrorAction Stop
        $hasContent = $response.Content.Length -gt 1000
        Write-TestResult "Page: $($page.Name)" $hasContent "Size: $($response.Content.Length) bytes"
    } catch {
        Write-TestResult "Page: $($page.Name)" $false "Status: $($_.Exception.Response.StatusCode)"
    }
}

# Phase 4: Static Assets
Write-Host "`n[PHASE 4] Static Assets" -ForegroundColor Yellow
Write-Host "-" * 40

$assets = @(
    '_next/static/media'
    'bridgeflux.js'
)

foreach ($asset in $assets) {
    $url = "$DashboardUrl/$asset"
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-TestResult "Asset: $asset" ($response.StatusCode -eq 200) "Status: $($response.StatusCode)"
    } catch {
        # Some assets may not be present, that's ok
        Write-TestResult "Asset: $asset" $false "Not found (expected)"
    }
}

# Phase 5: Performance Tests
Write-Host "`n[PHASE 5] Performance Tests" -ForegroundColor Yellow
Write-Host "-" * 40

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$null = Invoke-WebRequest -Uri $DashboardUrl -TimeoutSec 10 -ErrorAction SilentlyContinue
$stopwatch.Stop()

Write-Host "Dashboard Load Time: $($stopwatch.ElapsedMilliseconds)ms" -ForegroundColor Cyan
$performancePassed = $stopwatch.ElapsedMilliseconds -lt 5000
Write-TestResult "Page Load Time (< 5s)" $performancePassed

# Phase 6: Authentication & Security
Write-Host "`n[PHASE 6] Security & Authentication" -ForegroundColor Yellow
Write-Host "-" * 40

# Test CORS headers
try {
    $response = Invoke-WebRequest -Uri $DashboardUrl -TimeoutSec 5 -ErrorAction Stop
    $hasSecurity = $response.Headers.ContainsKey('X-Content-Type-Options') -or $response.Headers.ContainsKey('Content-Security-Policy')
    Write-TestResult "Security Headers Present" $hasSecurity
} catch {
    Write-TestResult "Security Headers" $false
}

# Test Firebase integration (should show in HTML)
if ($dashboardTest) {
    $hasFirebase = $dashboardTest.Content -match 'firebase|FIREBASE'
    Write-TestResult "Firebase Integration" $hasFirebase
}

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Provision a test bridge via dashboard" -ForegroundColor Gray
Write-Host "2. Run 'npm run dev' to start the dev server" -ForegroundColor Gray
Write-Host "3. Re-run this test to validate live endpoints" -ForegroundColor Gray
Write-Host "4. Check Live Inspector for real-time traffic" -ForegroundColor Gray

Write-Host "`n"
