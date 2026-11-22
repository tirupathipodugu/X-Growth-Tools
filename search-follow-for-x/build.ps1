# Builds the Chrome Web Store upload: dist/search-follow-for-x-<version>.zip
# Only runtime files go in; store/, dist/ and dev files are left out.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$version = (Get-Content manifest.json -Raw | ConvertFrom-Json).version
$files = @('manifest.json', 'popup.html', 'popup.js', 'content.js', 'icons')

foreach ($f in $files) { if (-not (Test-Path $f)) { throw "Missing $f" } }

New-Item -ItemType Directory -Force dist | Out-Null
$zip = "dist/search-follow-for-x-$version.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path $files -DestinationPath $zip
Write-Host "Built $zip"
