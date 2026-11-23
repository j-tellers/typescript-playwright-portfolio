param(
    [ValidateRange(1, 3600)]
    [int]$TimeoutSeconds = 120
)

$composeFile = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker-compose.yml'
try {
    . (Join-Path $PSScriptRoot 'load-compose-config.ps1')
}
catch {
    Write-Error "Unable to load Mealie configuration: $($_.Exception.Message)"
    exit 1
}
$healthUrl = "$env:MEALIE_BASE_URL/api/app/about"
$expectedPort = "127.0.0.1:$env:MEALIE_HOST_PORT"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error 'Docker was not found. Install Docker Desktop and make sure docker is on PATH.'
    exit 1
}

& docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Docker is not responding. Start Docker Desktop and try again.'
    exit 1
}

& docker compose -f $composeFile up -d mealie
if ($LASTEXITCODE -ne 0) {
    Write-Error "Mealie could not start. Check the Docker error above, Docker Compose availability, and whether port $env:MEALIE_HOST_PORT is in use."
    exit 1
}

$publishedPort = @(& docker compose -f $composeFile port mealie 9000)
if ($LASTEXITCODE -ne 0 -or $publishedPort.Count -ne 1 -or $publishedPort[0].Trim() -ne $expectedPort) {
    Write-Error "Mealie does not have the expected $expectedPort port mapping. Check the Compose service and, if appropriate, recreate its container without removing the volume."
    exit 1
}

$timer = [System.Diagnostics.Stopwatch]::StartNew()
$lastError = 'No response received.'
Write-Host "Waiting up to $TimeoutSeconds seconds for Mealie at $healthUrl"

while ($timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
    try {
        $requestTimeout = [int][Math]::Max(1, [Math]::Min(5, [Math]::Ceiling($TimeoutSeconds - $timer.Elapsed.TotalSeconds)))
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec $requestTimeout -ErrorAction Stop
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "Mealie is ready at $env:MEALIE_BASE_URL"
            exit 0
        }
        $lastError = "HTTP status $($response.StatusCode)"
    }
    catch {
        $lastError = $_.Exception.Message
    }

    $remainingSeconds = $TimeoutSeconds - $timer.Elapsed.TotalSeconds
    if ($remainingSeconds -gt 0) {
        Start-Sleep -Milliseconds ([int][Math]::Min(2000, $remainingSeconds * 1000))
    }
}

$serviceStatus = @(& docker compose -f $composeFile ps --format '{{.Name}}: {{.State}} ({{.Status}})' mealie)
if ($LASTEXITCODE -ne 0 -or $serviceStatus.Count -eq 0) {
    $serviceStatus = @('Service status unavailable; check Docker Compose.')
}
Write-Error "Mealie did not become ready within $TimeoutSeconds seconds. Last readiness error: $lastError. Service status: $($serviceStatus -join '; '). Check Mealie logs for details."
exit 1