param (
    [string]$ScreenDir = ""
)

if (-not $ScreenDir) {
    Write-Output '{"error": "Usage: stop-server.ps1 <screen_dir>"}'
    exit 1
}

$PidFile = Join-Path $ScreenDir ".server.pid"

if (Test-Path $PidFile) {
    $ServerPid = Get-Content $PidFile
    Stop-Process -Id $ServerPid -ErrorAction SilentlyContinue
    Remove-Item $PidFile -ErrorAction SilentlyContinue
    Remove-Item (Join-Path $ScreenDir ".server.log") -ErrorAction SilentlyContinue

    # Clean up ephemeral temp directories
    if ($ScreenDir -like "$($env:TEMP)*") {
        Remove-Item -Path $ScreenDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Output '{"status": "stopped"}'
} else {
    Write-Output '{"status": "not_running"}'
}
