$configFile = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'src\config\config.ts'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found. Install the version specified in .nvmrc and make sure node is on PATH.'
}
$configJson = & node -p 'JSON.stringify(require(process.argv[1]))' $configFile
if ($LASTEXITCODE -ne 0 -or -not $configJson) {
    throw 'Failed to load Mealie configuration from src\config\config.ts. Use the Node.js version specified in .nvmrc.'
}

$config = $configJson | ConvertFrom-Json -ErrorAction Stop
if (-not $config.mealieBaseUrl -or -not $config.mealieComposeProject) {
    throw 'Mealie configuration must include a base URL and Compose project name.'
}

$mealieComposeProject = $config.mealieComposeProject
$env:MEALIE_BASE_URL = $config.mealieBaseUrl
$env:MEALIE_HOST_PORT = ([Uri]$env:MEALIE_BASE_URL).Port.ToString()
