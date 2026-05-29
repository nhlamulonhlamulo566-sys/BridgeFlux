param(
  [string]$ServiceAccountPath = "$env:USERPROFILE\Desktop\studio-7583316153-57312-firebase-adminsdk-fbsvc-e6ce47ddd3.json",
  [string]$VercelEnvironment = "production"
)

Set-StrictMode -Version Latest

if (-not (Test-Path $ServiceAccountPath)) {
  Write-Error "Service account file not found: $ServiceAccountPath"
  Write-Host "Please supply the full path to your Firebase service account JSON file using -ServiceAccountPath."
  exit 1
}

$secretValue = Get-Content -Path $ServiceAccountPath -Raw

Write-Host "========================================"
Write-Host "Vercel secret helper for FIREBASE_SERVICE_ACCOUNT_KEY"
Write-Host "========================================"
Write-Host "Your service account JSON file was loaded from:`n  $ServiceAccountPath"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Sign in to Vercel CLI with 'npx vercel login' or use the Vercel dashboard."
Write-Host "2) Create the environment variable in your project:"
Write-Host "   FIREBASE_SERVICE_ACCOUNT_KEY"
Write-Host "3) Paste the full JSON content of the file into the secret value."
Write-Host "4) Deploy your app again."
Write-Host ""
Write-Host "Optional automated CLI command (if your Vercel CLI supports --stdin):"
Write-Host "  Get-Content -Path `"$ServiceAccountPath`" -Raw | npx vercel env add FIREBASE_SERVICE_ACCOUNT_KEY $VercelEnvironment --stdin"
Write-Host ""
Write-Host "If you prefer the dashboard, copy the JSON content below and paste it into the secret value field."
Write-Host "========================================"
Write-Host $secretValue
