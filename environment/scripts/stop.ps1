$composeFile = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker-compose.yml'

try {
    . (Join-Path $PSScriptRoot 'load-compose-config.ps1')
}
catch {
    Write-Error "Unable to load Mealie configuration: $($_.Exception.Message)"
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error 'Docker was not found. Install Docker Desktop and make sure docker is on PATH.'
    exit 1
}

& docker compose -p $mealieComposeProject -f $composeFile stop mealie
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Mealie could not be stopped. Check the Docker error above and ensure Docker Desktop and Compose are available.'
    exit 1
}

Write-Host 'Mealie stopped. Its data volume has been retained.'