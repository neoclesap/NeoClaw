param (
    [string]$ProjectDir = "",
    [string]$Host_Bind = "127.0.0.1",
    [string]$UrlHost = "",
    [switch]$Foreground,
    [switch]$Background
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not $UrlHost) {
    if ($Host_Bind -eq "127.0.0.1" -or $Host_Bind -eq "localhost") {
        $UrlHost = "localhost"
    } else {
        $UrlHost = $Host_Bind
    }
}

# Generate unique session ID
$SessionId = "$(Get-Process -Id $PID | Select-Object -ExpandProperty Id)-$(Get-Date -UFormat %s)"

if ($ProjectDir) {
    $ScreenDir = Join-Path $ProjectDir ".superpowers\brainstorm\$SessionId"
} else {
    $ScreenDir = Join-Path $env:TEMP "brainstorm-$SessionId"
}

$PidFile = Join-Path $ScreenDir ".server.pid"
$LogFile = Join-Path $ScreenDir ".server.log"

# Create session directory
if (-not (Test-Path $ScreenDir)) {
    New-Item -ItemType Directory -Path $ScreenDir -Force | Out-Null
}

# Kill existing server if any (though session IDs are unique, keep logic)
if (Test-Path $PidFile) {
    $OldPid = Get-Content $PidFile
    Stop-Process -Id $OldPid -ErrorAction SilentlyContinue
    Remove-Item $PidFile -ErrorAction SilentlyContinue
}

# Resolve Owner PID (equivalent to shell PPID)
try {
    $ParentProcessId = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID").ParentProcessId
    $OwnerPid = (Get-CimInstance Win32_Process -Filter "ProcessId=$ParentProcessId").ParentProcessId
} catch {
    $OwnerPid = $PID
}

$EnvVars = @{
    BRAINSTORM_DIR = $ScreenDir
    BRAINSTORM_HOST = $Host_Bind
    BRAINSTORM_URL_HOST = $UrlHost
    BRAINSTORM_OWNER_PID = $OwnerPid
}

if ($Foreground) {
    $PID | Out-File $PidFile
    foreach ($key in $EnvVars.Keys) { $env:$key = $EnvVars[$key] }
    Set-Location $ScriptDir
    node server.js
    exit $LASTEXITCODE
}

# Background mode
$StartInfo = New-Object System.Diagnostics.ProcessStartInfo
$StartInfo.FileName = "node"
$StartInfo.Arguments = "server.js"
$StartInfo.WorkingDirectory = $ScriptDir
$StartInfo.RedirectStandardOutput = $true
$StartInfo.RedirectStandardError = $true
$StartInfo.UseShellExecute = $false
$StartInfo.CreateNoWindow = $true

foreach ($key in $EnvVars.Keys) {
    $StartInfo.EnvironmentVariables[$key] = [string]$EnvVars[$key]
}

$Process = New-Object System.Diagnostics.Process
$Process.StartInfo = $StartInfo

$LogStream = [System.IO.StreamWriter]::new($LogFile)
$Process.OutputDataReceived += { if ($_.Data) { $LogStream.WriteLine($_.Data); $LogStream.Flush() } }
$Process.ErrorDataReceived += { if ($_.Data) { $LogStream.WriteLine($_.Data); $LogStream.Flush() } }

if ($Process.Start()) {
    $Process.BeginOutputReadLine()
    $Process.BeginErrorReadLine()
    $Process.Id | Out-File $PidFile
    
    # Wait for server-started
    for ($i = 0; $i -lt 50; $i++) {
        if (Test-Path $LogFile) {
            $Content = Get-Content $LogFile -Raw
            if ($Content -match "server-started") {
                $Match = $Content -split "`n" | Where-Object { $_ -match "server-started" } | Select-Object -First 1
                Write-Output $Match
                exit 0
            }
        }
        Start-Sleep -Milliseconds 100
    }
    
    Write-Output '{"error": "Server failed to start within 5 seconds"}'
    exit 1
} else {
    Write-Output '{"error": "Failed to start node process"}'
    exit 1
}
