# Manual free deploy of the Nezaleika PWA to GitHub Pages (gh-pages branch).
# Does not use GitHub Actions (no Actions minutes / billing).
#
# Usage:
#   cd d:\RussM\nezaleika
#   .\scripts\deploy-pages.ps1
#
# Optional:
#   .\scripts\deploy-pages.ps1 -ApiBase https://nezaleika.up.railway.app

param(
  [string]$ApiBase = $(if ($env:NEZALEIKA_API_URL) { $env:NEZALEIKA_API_URL } else { 'https://nezaleika.up.railway.app' }),
  [string]$BaseUrl = '/nezaleika/',
  [string]$Message = 'Deploy PWA'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$web = Join-Path $root 'web'
$apiBase = $ApiBase.TrimEnd('/')

if (-not (Test-Path (Join-Path $web 'package.json'))) {
  throw "web/package.json not found under $root"
}

Write-Host "API:  $apiBase"
Write-Host "Base: $BaseUrl"
Write-Host "Web:  $web"

Push-Location $web
try {
  if (-not (Test-Path 'node_modules')) {
    npm ci
  }
  $env:NUXT_APP_BASE_URL = $BaseUrl
  $env:NUXT_PUBLIC_API_BASE = $apiBase
  npm run generate
  if ($LASTEXITCODE -ne 0) { throw "nuxt generate failed ($LASTEXITCODE)" }
  New-Item -ItemType File -Path '.output/public/.nojekyll' -Force | Out-Null
} finally {
  Pop-Location
}

$tmp = Join-Path $env:TEMP 'nezaleika-gh-pages'
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }

git clone --depth 1 -b gh-pages https://github.com/MacallanS/nezaleika.git $tmp
Get-ChildItem $tmp -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $web '.output/public/*') -Destination $tmp -Recurse -Force

Push-Location $tmp
try {
  git add -A
  $pending = git status --porcelain
  if (-not $pending) {
    Write-Host 'No PWA changes to publish.'
    return
  }
  git -c user.name='MacallanS' -c user.email='khametovartem@gmail.com' commit -m $Message
  git push origin gh-pages
  Write-Host 'Published: https://macallans.github.io/nezaleika/'
} finally {
  Pop-Location
}
