# One-shot: ensure public GitHub repo exists (free Pages).
# PWA publish: use .\scripts\deploy-pages.ps1 (no Actions).
# API: push main → Railway free/trial (or Render free).

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

gh auth status | Out-Null

$repo = 'MacallanS/nezaleika'
if (-not (gh repo view $repo 2>$null)) {
  gh repo create $repo --public --source=. --remote=origin --push
} else {
  git push -u origin HEAD
}

Write-Host ''
Write-Host '=== Free stack ===' -ForegroundColor Green
Write-Host 'PWA:  .\scripts\deploy-pages.ps1  → https://macallans.github.io/nezaleika/'
Write-Host 'API:  git push origin main → Railway (free/trial)'
Write-Host 'Pages Settings: branch gh-pages / root (not GitHub Actions)'
Write-Host 'Do not enable schedule Actions — they burn free minutes and can lock billing.'
