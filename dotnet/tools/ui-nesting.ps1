param(
    [Parameter(Mandatory = $true)][string]$ExePath,
    [string]$OutDir = "$env:TEMP\makercam-nesting-test"
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $OutDir | Out-Null

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECT { public int Left, Top, Right, Bottom; }
public struct POINT { public int X, Y; }
public static class Native {
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, IntPtr extra);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);
}
"@

function Assert-Equal($expected, $actual, $label) {
    if ("$expected" -ne "$actual") { throw "$label : expected '$expected', got '$actual'" }
    Write-Output "PASS $label = $actual"
}

function Read-Text($window, [string]$id) {
    $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $id)
    $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
    if ($null -eq $element) { throw "Element '$id' not found" }
    return $element.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::NameProperty)
}

function Find-Button($window, [string]$name) {
    $byName = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $name)
    $byType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button)
    return $window.FindFirst(
        [System.Windows.Automation.TreeScope]::Descendants,
        (New-Object System.Windows.Automation.AndCondition($byName, $byType)))
}

function Find-Window([string]$pattern) {
    $all = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::Window -and
            $element.Current.Name -match $pattern) { return $element }
    }
    return $null
}

function Find-TextByPattern($window, [string]$pattern) {
    $all = $window.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::Text -and
            $element.Current.Name -match $pattern) { return $element }
    }
    return $null
}

function Find-MenuItem([int]$processId, [string]$pattern) {
    $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $processId)
    $all = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants, $condition)
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::MenuItem -and
            $element.Current.Name -match $pattern) { return $element }
    }
    return $null
}

function Expand-Menu([int]$processId, [string]$name) {
    $item = Find-MenuItem $processId "^$name$"
    if ($null -eq $item) { throw "Menu '$name' not found" }
    try {
        $item.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand()
    }
    catch {
        $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    }
    Start-Sleep -Milliseconds 400
}

function Invoke-MenuItem([int]$processId, [string]$pattern) {
    $item = Find-MenuItem $processId $pattern
    if ($null -eq $item) { throw "Menu item '$pattern' not found" }
    $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    Start-Sleep -Milliseconds 900
}

function Click-Client([int]$x, [int]$y) {
    $point = New-Object POINT
    $point.X = $x; $point.Y = $y
    [Native]::ClientToScreen([IntPtr]$script:hwnd, [ref]$point) | Out-Null
    [Native]::SetCursorPos($point.X, $point.Y) | Out-Null
    Start-Sleep -Milliseconds 80
    [Native]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
    [Native]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 350
}

function Press-Keys([string]$keys) {
    [Native]::SetForegroundWindow([IntPtr]$script:hwnd) | Out-Null
    Start-Sleep -Milliseconds 150
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 700
}

function Send-RawKeys([string]$keys) {
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 900
}

function Save-ProjectAs([string]$path) {
    if (Test-Path $path) { Remove-Item $path -Force }
    Press-Keys '^s'
    Start-Sleep -Milliseconds 1200
    $dialog = Find-Window '^Save project$'
    if ($null -eq $dialog) { $dialog = Find-Window '^Save' }
    if ($null -eq $dialog) { throw 'Save dialog did not open' }
    Send-RawKeys '^a'
    Send-RawKeys $path
    Send-RawKeys '{ENTER}'
    Start-Sleep -Milliseconds 1800
    if (-not (Test-Path $path)) { throw "Save did not create $path" }
}

# ---------------------------------------------------------------------
# Start with the example project
# ---------------------------------------------------------------------

$proc = Start-Process -FilePath $ExePath -ArgumentList '--example' -PassThru
Start-Sleep -Seconds 4
$proc.Refresh()
$script:hwnd = $proc.MainWindowHandle
[Native]::SetForegroundWindow([IntPtr]$script:hwnd) | Out-Null
Start-Sleep -Milliseconds 500

$condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
    [System.Windows.Automation.TreeScope]::Children, $condition)
if ($null -eq $window) { throw 'Main window not found' }
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'example loaded'

# ---------------------------------------------------------------------
# Select the outer outline path by scanning inward from the left edge
# ---------------------------------------------------------------------

$client = New-Object RECT
[Native]::GetClientRect([IntPtr]$script:hwnd, [ref]$client) | Out-Null
$canvasWidth = ($client.Right - $client.Left) - 311
$canvasHeight = ($client.Bottom - $client.Top) - 99
$scanY = 69 + [int]($canvasHeight / 2)

$selected = $false
for ($x = 30; $x -lt [int]($canvasWidth / 2); $x += 4) {
    Click-Client $x $scanY
    if ((Read-Text $window 'StatusSelection') -like '1 path*') {
        $selected = $true
        break
    }
}
if (-not $selected) { throw 'Could not select the outer path for the nesting boundary' }
Write-Output "PASS boundary path selected at canvas x=$x"

$before = Join-Path $OutDir 'before-nest.svg'
$after = Join-Path $OutDir 'after-nest.svg'
$undone = Join-Path $OutDir 'after-undo.svg'
Save-ProjectAs $before
Write-Output 'PASS saved pre-nest project'

# ---------------------------------------------------------------------
# Set the boundary and nest
# ---------------------------------------------------------------------

Expand-Menu $proc.Id 'Nesting'
Invoke-MenuItem $proc.Id '^Set material boundary'
Start-Sleep -Milliseconds 500

Expand-Menu $proc.Id 'Nesting'
Invoke-MenuItem $proc.Id '^Nest toolpaths'
$dialog = Find-Window '^Nest toolpaths$'
if ($null -eq $dialog) { throw 'Nest dialog did not open' }

$nestButton = Find-Button $dialog 'Nest'
if ($null -eq $nestButton) { throw 'Nest button not found' }
$nestButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()

$toast = $null
for ($i = 0; $i -lt 40 -and $null -eq $toast; $i++) {
    Start-Sleep -Milliseconds 500
    $toast = Find-TextByPattern $window '^Nested '
}
if ($null -eq $toast) { throw 'Nesting produced no completion message' }
Write-Output "PASS $($toast.Current.Name)"

Save-ProjectAs $after
$beforeText = Get-Content $before -Raw
$afterText = Get-Content $after -Raw
if ($beforeText -eq $afterText) { throw 'Nesting did not change the project geometry' }
Write-Output 'PASS nesting changed the saved geometry'

# ---------------------------------------------------------------------
# Undo restores the exact pre-nest project
# ---------------------------------------------------------------------

Press-Keys '^z'
Start-Sleep -Milliseconds 500
Save-ProjectAs $undone
$undoneText = Get-Content $undone -Raw
if ($undoneText -ne $beforeText) { throw 'Undo did not restore the pre-nest geometry exactly' }
Write-Output 'PASS undo restored the pre-nest geometry'

Remove-Item $before, $after, $undone -Force -ErrorAction SilentlyContinue
$proc.CloseMainWindow() | Out-Null
Start-Sleep -Milliseconds 1500
if (-not $proc.HasExited) { $proc.Kill() }
Write-Output 'NESTING TEST OK'
