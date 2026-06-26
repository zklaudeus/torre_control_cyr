param(
  [string]$HostName = "187.127.31.167",
  [string]$User = "root",
  [string]$RemoteDir = "/opt/torre-control",
  [string]$Domain = "https://eisesa.cloud",
  [switch]$SkipLocalChecks
)

$ErrorActionPreference = "Stop"

function Step($Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No encuentro '$Name'. Instálalo o agrégalo al PATH."
  }
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Require-Command git
Require-Command tar
Require-Command scp
Require-Command ssh

if (-not (Test-Path ".deploy-bundle")) {
  New-Item -ItemType Directory ".deploy-bundle" | Out-Null
}

if (-not $SkipLocalChecks) {
  Step "Validando frontend"
  npm.cmd --prefix frontend run build

  Step "Validando backend"
  .\backend\.venv\Scripts\python.exe -m pytest -p no:cacheprovider backend/tests -q
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ArchiveName = "torre-control-update-$Stamp.tar.gz"
$ArchivePath = ".deploy-bundle\$ArchiveName"
$RemoteArchive = "/tmp/$ArchiveName"

Step "Creando paquete $ArchiveName"
$Files = git ls-files -co --exclude-standard | Where-Object {
  $_ -notmatch '(^|/)(node_modules|dist|\.venv|__pycache__|\.pytest_cache|\.git|\.deploy-bundle|\.backups)(/|$)' -and
  $_ -notmatch '\.pyc$' -and
  $_ -notmatch '(^|/)\.env(\..*)?$' -and
  $_ -notmatch '^backend/\.env(\..*)?$' -and
  $_ -notmatch '^frontend/\.env(\..*)?$'
}

if (-not $Files -or $Files.Count -eq 0) {
  throw "No encontré archivos para empaquetar."
}

tar -czf $ArchivePath @Files

Step "Subiendo paquete al VPS"
Write-Host "Si pide password, escríbelo en esta ventana de PowerShell." -ForegroundColor Yellow
scp $ArchivePath "${User}@${HostName}:${RemoteArchive}"

Step "Actualizando aplicación en el VPS"
$RemoteCommands = @"
set -e
cd $RemoteDir
tar -xzf $RemoteArchive -C $RemoteDir
docker compose config >/tmp/torre-compose-config.txt
docker compose build --pull
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:8080/health >/dev/null
curl -fsS http://127.0.0.1:8080/api/health/db >/dev/null
rm -f $RemoteArchive
"@

$RemoteCommands | ssh "${User}@${HostName}" "bash -s"

Step "Verificando sitio público"
curl.exe -fsS "$Domain/api/health/db"

Write-Host ""
Write-Host "Deploy listo: $Domain" -ForegroundColor Green
