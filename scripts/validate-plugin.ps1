$ErrorActionPreference = "Stop"
$pluginRoot = Split-Path -Parent $PSScriptRoot
$cliPath = Join-Path $pluginRoot "bin\forgemind.mjs"
$legacyName = [IO.Path]::GetFileNameWithoutExtension($MyInvocation.MyCommand.Name)
[Console]::Error.WriteLine("ForgeMind PowerShell compatibility launcher: prefer node bin/forgemind.mjs.")
& node $cliPath legacy $legacyName @args --json
exit $LASTEXITCODE