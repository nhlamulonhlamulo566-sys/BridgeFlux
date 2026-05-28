param()
Set-StrictMode -Version Latest
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Building production assets..."
npm run build

$OutDir = Join-Path $Root 'dist\publish'
if (Test-Path $OutDir) { Remove-Item -Recurse -Force $OutDir }
New-Item -ItemType Directory -Path $OutDir | Out-Null

Write-Host "Collecting installer artifacts..."
Copy-Item -Path (Join-Path $Root 'public\*') -Destination $OutDir -Recurse -Force -ErrorAction SilentlyContinue

$Version = node -p "require('./package.json').version"
$Stamp = Get-Date -Format yyyyMMddHHmmss
$ZipName = "bridgeflux-$Version-$Stamp.zip"

Write-Host "Packaging $ZipName"
Push-Location $Root
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $Root 'dist\publish'), (Join-Path $Root $ZipName))

Write-Host "Generating checksums..."
try {
	$files = Get-ChildItem -Path $OutDir -Recurse -File | Sort-Object FullName
	$checksumLines = foreach ($f in $files) {
		$hash = Get-FileHash -Algorithm SHA256 -Path $f.FullName
		$relative = $f.FullName.Substring($OutDir.Length+1).Replace('\','/')
		"{0}  {1}" -f $hash.Hash, $relative
	}
	$checksumLines | Out-File -FilePath (Join-Path $OutDir 'checksums.sha256') -Encoding utf8
} catch {
	Write-Warning "Failed to generate checksums: $_"
}
Write-Host "Created $Root\$ZipName"
Write-Host "To publish locally using GitHub CLI:" 
Write-Host "  gh release create v$Version $Root\$ZipName --title 'BridgeFlux $Version' --notes 'Local release $Stamp'"
Pop-Location
