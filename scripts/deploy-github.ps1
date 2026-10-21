# Requires: gh auth login (account MacallanS)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

gh auth status | Out-Null

$repo = "MacallanS/nezaleika"
if (-not (gh repo view $repo 2>$null)) {
  gh repo create $repo --public --source=. --remote=origin --push
} else {
  git push -u origin main
}

Write-Host ""
Write-Host "=== GitHub Pages ===" -ForegroundColor Green
Write-Host "1. Repo -> Settings -> Pages -> Source: GitHub Actions"
Write-Host "2. Settings -> Secrets and variables -> Actions -> Variables"
Write-Host "   NEZALEIKA_API_URL = https://YOUR-SERVICE.onrender.com"
Write-Host ""
Write-Host "=== Render API ===" -ForegroundColor Green
Write-Host "1. https://dashboard.render.com -> New -> Blueprint -> repo $repo"
Write-Host "2. Env: CORS_ALLOWED_ORIGINS=https://macallans.github.io"
Write-Host "3. After deploy, set NEZALEIKA_API_URL in GitHub and re-run Pages workflow"
Write-Host ""
Write-Host "Site: https://macallans.github.io/nezaleika/"
