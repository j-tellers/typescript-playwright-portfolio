$configFile = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'src\config\config.ts'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js was not found. Install the version specified in .nvmrc and make sure node is on PATH.'
}
$baseUrl = & node -p 'require(process.argv[1]).mealieBaseUrl' $configFile
if ($LASTEXITCODE -ne 0 -or -not $baseUrl) {
    throw 'Failed to load the Mealie base URL from src\config\config.ts. Use the Node.js version specified in .nvmrc.'
}

$env:MEALIE_BASE_URL = $baseUrl.Trim()
$env:MEALIE_HOST_PORT = ([Uri]$env:MEALIE_BASE_URL).Port.ToString()
