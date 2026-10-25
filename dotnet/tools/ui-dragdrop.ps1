param(
    [Parameter(Mandatory = $true)][string]$ExePath,
    [string]$OutDir = "$env:TEMP\makercam-dragdrop-test"
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
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr after, int x, int y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, IntPtr extra);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")] public static extern IntPtr FindWindow(string className, string windowName);
    [DllImport("user32.dll")] public static extern IntPtr GetDlgItem(IntPtr dialog, int id);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);
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

function Press-Keys([string]$keys) {
    [Native]::SetForegroundWindow([IntPtr]$script:appHwnd) | Out-Null
    Start-Sleep -Milliseconds 150
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 700
}

function Drag-Screen([int]$x1, [int]$y1, [int]$x2, [int]$y2) {
    [Native]::SetCursorPos($x1, $y1) | Out-Null
    Start-Sleep -Milliseconds 400
    [Native]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)  # left down
    Start-Sleep -Milliseconds 700
    for ($i = 1; $i -le 30; $i++) {
        $x = [int]($x1 + ($x2 - $x1) * $i / 30)
        $y = [int]($y1 + ($y2 - $y1) * $i / 30)
        [Native]::SetCursorPos($x, $y) | Out-Null
        Start-Sleep -Milliseconds 40
    }
    Start-Sleep -Milliseconds 700
    [Native]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)  # left up
    Start-Sleep -Milliseconds 1800
}

function Click-DialogButton([int]$id) {
    $dialog = [Native]::FindWindow('#32770', 'MakerCam')
    if ($dialog -eq [IntPtr]::Zero) { throw 'Message box not found' }
    $button = [Native]::GetDlgItem($dialog, $id)
    if ($button -eq [IntPtr]::Zero) { throw "Message box button $id not found" }
    [Native]::SendMessage($button, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    Start-Sleep -Milliseconds 600
}

# ---------------------------------------------------------------------
# Test file and folder
# ---------------------------------------------------------------------

$folder = Join-Path $OutDir 'makercam-drop-target'
if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Force $folder | Out-Null
$testSvg = @'
<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="20mm" height="20mm" viewBox="0 0 20 20">
  <rect id="dropped" x="2" y="2" width="16" height="16"/>
</svg>
'@
Set-Content -Path (Join-Path $folder 'dropped.svg') -Value $testSvg -Encoding UTF8

# ---------------------------------------------------------------------
# Start the app with the example and place it on the left
# ---------------------------------------------------------------------

$proc = Start-Process -FilePath $ExePath -PassThru
Start-Sleep -Seconds 4
$proc.Refresh()
$script:appHwnd = $proc.MainWindowHandle
[Native]::SetWindowPos([IntPtr]$script:appHwnd, [IntPtr]::Zero, 0, 0, 1000, 900, 0x0044) | Out-Null
[Native]::SetForegroundWindow([IntPtr]$script:appHwnd) | Out-Null
Start-Sleep -Milliseconds 700

$appCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
    [System.Windows.Automation.TreeScope]::Children, $appCondition)
if ($null -eq $window) { throw 'Main window not found' }
Assert-Equal 'No operations yet' (Read-Text $window 'OpCount') 'startup'

# The start card is visible at launch; Esc dismisses it so the canvas is clear.
$loadButton = Find-Button $window 'Load example'
if ($null -eq $loadButton -or $loadButton.Current.IsOffscreen) {
    throw 'Start card was not visible at launch'
}
Write-Output 'PASS start card visible at launch'

Press-Keys '{ESC}'
Start-Sleep -Milliseconds 700
$loadButton = Find-Button $window 'Load example'
if ($null -ne $loadButton -and -not $loadButton.Current.IsOffscreen) {
    throw 'Esc did not dismiss the start card'
}
Write-Output 'PASS Esc dismissed the start card'

Press-Keys '^a'
Assert-Equal '0 paths selected' (Read-Text $window 'StatusSelection') 'empty document after dismissal'

# ---------------------------------------------------------------------
# Open Explorer at the test folder and place it on the right
# ---------------------------------------------------------------------

Start-Process explorer.exe -ArgumentList "/separate,`"$folder`"" | Out-Null
Start-Sleep -Seconds 3

$explorer = $null
for ($i = 0; $i -lt 20 -and $null -eq $explorer; $i++) {
    $all = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Children,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($element in $all) {
        if ($element.Current.ClassName -eq 'CabinetWClass' -and
            $element.Current.Name -match 'makercam-drop-target') {
            $explorer = $element
            break
        }
    }
    if ($null -eq $explorer) { Start-Sleep -Milliseconds 500 }
}
if ($null -eq $explorer) { throw 'Explorer window not found' }

$script:explorerHwnd = [IntPtr]$explorer.Current.NativeWindowHandle
[Native]::SetWindowPos($script:explorerHwnd, [IntPtr]::Zero, 1000, 0, 920, 900, 0x0044) | Out-Null
[Native]::SetForegroundWindow($script:explorerHwnd) | Out-Null
Start-Sleep -Seconds 1

# Find the dropped.svg item in the Explorer view.
$fileItem = $null
$all = $explorer.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    [System.Windows.Automation.Condition]::TrueCondition)
foreach ($element in $all) {
    $type = $element.Current.ControlType
    if (($type -eq [System.Windows.Automation.ControlType]::ListItem -or
         $type -eq [System.Windows.Automation.ControlType]::DataItem) -and
        $element.Current.Name -match '^dropped(\.svg)?$') {
        $fileItem = $element
        break
    }
}
if ($null -eq $fileItem) { throw 'dropped.svg item not found in Explorer' }

$itemRect = $fileItem.Current.BoundingRectangle
$startX = [int]($itemRect.X + $itemRect.Width / 2)
$startY = [int]($itemRect.Y + $itemRect.Height / 2)

$target = New-Object POINT
$target.X = 400; $target.Y = 300
[Native]::ClientToScreen([IntPtr]$script:appHwnd, [ref]$target) | Out-Null

Write-Output "INFO dragging from ($startX,$startY) to ($($target.X),$($target.Y))"
Drag-Screen $startX $startY $target.X $target.Y

# ---------------------------------------------------------------------
# Verify the drop imported one path
# ---------------------------------------------------------------------

$toast = $null
for ($i = 0; $i -lt 10 -and $null -eq $toast; $i++) {
    $toast = Find-TextByPattern $window '^Imported 1 path'
    if ($null -eq $toast) { Start-Sleep -Milliseconds 400 }
}
if ($null -eq $toast) { throw 'No import toast after the drop' }
Write-Output "PASS $($toast.Current.Name)"

Press-Keys '^a'
Assert-Equal '1 path selected' (Read-Text $window 'StatusSelection') 'drop added one path'

# ---------------------------------------------------------------------
# Clean up
# ---------------------------------------------------------------------

[Native]::PostMessage($script:explorerHwnd, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
Start-Sleep -Milliseconds 800
Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue

Press-Keys '%{F4}'
Start-Sleep -Milliseconds 800
if ($null -ne [Native]::FindWindow('#32770', 'MakerCam')) {
    Click-DialogButton 7   # discard the imported path
}
Start-Sleep -Milliseconds 1500
$proc.Refresh()
if (-not $proc.HasExited) { $proc.Kill() }

Write-Output 'DRAGDROP TEST OK'
