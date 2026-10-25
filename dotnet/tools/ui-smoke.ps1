param(
    [Parameter(Mandatory = $true)][string]$ExePath,
    [string]$OutDir = "$env:TEMP\makercam-smoke"
)

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $OutDir | Out-Null

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECT { public int Left, Top, Right, Bottom; }
public struct POINT { public int X, Y; }
public static class Native {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, IntPtr extra);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr FindWindow(string className, string windowName);
    [DllImport("user32.dll")] public static extern IntPtr GetDlgItem(IntPtr dialog, int id);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr hWnd, uint message, IntPtr wParam, IntPtr lParam);
}
"@

function Assert-Equal($expected, $actual, $label) {
    if ("$expected" -ne "$actual") { throw "$label : expected '$expected', got '$actual'" }
    Write-Output "PASS $label = $actual"
}

function Find-ById($window, [string]$id) {
    $condition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $id)
    return $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Find-Button($window, [string]$name) {
    $byName = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $name)
    $byType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button)
    $condition = New-Object System.Windows.Automation.AndCondition($byName, $byType)
    return $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Find-Window([string]$name) {
    $byName = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::NameProperty, $name)
    $byType = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Window)
    $condition = New-Object System.Windows.Automation.AndCondition($byName, $byType)
    return [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
        [System.Windows.Automation.TreeScope]::Descendants, $condition)
}

function Read-Text($window, [string]$id) {
    $element = Find-ById $window $id
    if ($null -eq $element) { throw "Element '$id' not found" }
    return $element.GetCurrentPropertyValue([System.Windows.Automation.AutomationElement]::NameProperty)
}

function Invoke-Button($window, [string]$name) {
    $button = Find-Button $window $name
    if ($null -eq $button) { throw "Button '$name' not found" }
    $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    Start-Sleep -Milliseconds 700
}

function Shot([string]$name, $element) {
    if ($null -ne $element) {
        $rect = $element.Current.BoundingRectangle
        $x = [int]$rect.X; $y = [int]$rect.Y
        $w = [int]$rect.Width; $h = [int]$rect.Height
    } else {
        $r = New-Object RECT
        [Native]::GetWindowRect([IntPtr]$script:hwnd, [ref]$r) | Out-Null
        $x = $r.Left; $y = $r.Top
        $w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top
    }
    if ($w -le 0 -or $h -le 0) { return }
    $bitmap = New-Object System.Drawing.Bitmap($w, $h)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($x, $y, 0, 0, $bitmap.Size)
    $graphics.Dispose()
    $path = Join-Path $OutDir "$name.png"
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    Write-Output "SHOT $path"
}

function Click-Client([int]$x, [int]$y) {
    $point = New-Object POINT
    $point.X = $x
    $point.Y = $y
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

function Drag-Client([int]$x1, [int]$y1, [int]$x2, [int]$y2) {
    $start = New-Object POINT
    $start.X = $x1; $start.Y = $y1
    [Native]::ClientToScreen([IntPtr]$script:hwnd, [ref]$start) | Out-Null
    [Native]::SetCursorPos($start.X, $start.Y) | Out-Null
    Start-Sleep -Milliseconds 150
    [Native]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
    for ($i = 1; $i -le 12; $i++) {
        $point = New-Object POINT
        $point.X = [int]($x1 + ($x2 - $x1) * $i / 12)
        $point.Y = [int]($y1 + ($y2 - $y1) * $i / 12)
        [Native]::ClientToScreen([IntPtr]$script:hwnd, [ref]$point) | Out-Null
        [Native]::SetCursorPos($point.X, $point.Y) | Out-Null
        Start-Sleep -Milliseconds 35
    }
    [Native]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 500
}

function Wheel([int]$delta) {
    $point = New-Object POINT
    $point.X = 500; $point.Y = 400
    [Native]::ClientToScreen([IntPtr]$script:hwnd, [ref]$point) | Out-Null
    [Native]::SetCursorPos($point.X, $point.Y) | Out-Null
    Start-Sleep -Milliseconds 150
    $data = if ($delta -lt 0) { [uint32](4294967296 + $delta) } else { [uint32]$delta }
    [Native]::mouse_event(0x0800, 0, 0, $data, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 500
}

# Native MessageBox buttons are not exposed reliably to UI Automation, so click
# them through their Win32 control IDs (IDCANCEL=2, IDNO=7, IDYES=6).
function Click-DialogButton([int]$id) {
    $dialog = [Native]::FindWindow('#32770', 'MakerCam')
    if ($dialog -eq [IntPtr]::Zero) { throw 'Message box not found' }
    $button = [Native]::GetDlgItem($dialog, $id)
    if ($button -eq [IntPtr]::Zero) { throw "Message box button $id not found" }
    [Native]::SendMessage($button, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
    Start-Sleep -Milliseconds 600
}

# Send keys to whichever window is active (used by modal file dialogs).
function Send-RawKeys([string]$keys) {
    [System.Windows.Forms.SendKeys]::SendWait($keys)
    Start-Sleep -Milliseconds 900
}

function Click-Screen([int]$x, [int]$y) {
    [Native]::SetCursorPos($x, $y) | Out-Null
    Start-Sleep -Milliseconds 120
    [Native]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
    [Native]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 400
}

function Find-TextByName($window, [string]$name) {
    $all = $window.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::Text -and
            $element.Current.Name -eq $name) { return $element }
    }
    return $null
}

function Get-OpOrder($window) {
    $names = @('Bolt holes', 'Inner pocket', 'Plate outline')
    $all = $window.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        [System.Windows.Automation.Condition]::TrueCondition)
    $items = @()
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::Text -and
            $names -contains $element.Current.Name) {
            $items += [pscustomobject]@{
                Name = $element.Current.Name
                Y = $element.Current.BoundingRectangle.Y
            }
        }
    }
    return @($items | Sort-Object Y | ForEach-Object { $_.Name })
}

function Find-MenuItemGlobal([int]$processId, [string]$pattern) {
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
    $item = Find-MenuItemGlobal $processId "^$name$"
    if ($null -eq $item) { throw "Menu '$name' not found" }
    try {
        $item.GetCurrentPattern(
            [System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand()
    }
    catch {
        $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    }
    Start-Sleep -Milliseconds 400
}

function Invoke-MenuItem([int]$processId, [string]$pattern) {
    $item = Find-MenuItemGlobal $processId $pattern
    if ($null -eq $item) { throw "Menu item '$pattern' not found" }
    $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    Start-Sleep -Milliseconds 900
}

function Find-WindowLike([string]$pattern) {
    $all = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
        [System.Windows.Automation.TreeScope]::Descendants,
        [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($element in $all) {
        if ($element.Current.ControlType -eq [System.Windows.Automation.ControlType]::Window -and
            $element.Current.Name -match $pattern) { return $element }
    }
    return $null
}

# ---------------------------------------------------------------------
# Start the app
# ---------------------------------------------------------------------

$proc = Start-Process -FilePath $ExePath -PassThru
Start-Sleep -Seconds 4
$proc.Refresh()
$script:hwnd = $proc.MainWindowHandle
[Native]::ShowWindow([IntPtr]$script:hwnd, 9) | Out-Null
[Native]::SetForegroundWindow([IntPtr]$script:hwnd) | Out-Null
Start-Sleep -Milliseconds 500

$condition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $proc.Id)
$window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
    [System.Windows.Automation.TreeScope]::Children, $condition)
if ($null -eq $window) { throw "Main window not found" }

Assert-Equal 'No operations yet' (Read-Text $window 'OpCount') 'startup operation count'
Assert-Equal '0 paths selected' (Read-Text $window 'StatusSelection') 'startup selection'
Shot '01-empty' $window

# ---------------------------------------------------------------------
# Insert a shape through both dialogs
# ---------------------------------------------------------------------

Invoke-Button $window 'Insert shape'
$dialog = Find-Window 'Insert shape'
if ($null -eq $dialog) { throw 'Insert shape dialog did not open' }
Shot '02-shape-dialog' $dialog
Invoke-Button $dialog 'Continue'

$dialog = Find-Window 'Insert circle'
if ($null -eq $dialog) { throw 'Insert circle dialog did not open' }
Shot '03-circle-dialog' $dialog
Invoke-Button $dialog 'Insert'
Start-Sleep -Milliseconds 500
Assert-Equal '1 path selected' (Read-Text $window 'StatusSelection') 'shape inserted and selected'
Shot '04-shape-inserted' $window

Press-Keys '^z'
Assert-Equal '0 paths selected' (Read-Text $window 'StatusSelection') 'undo shape'
Assert-Equal 'No operations yet' (Read-Text $window 'OpCount') 'undo shape operation count'

# ---------------------------------------------------------------------
# Load the example from the empty-state card
# ---------------------------------------------------------------------

Invoke-Button $window 'Load example'
Start-Sleep -Milliseconds 900
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'example operations'
Shot '05-example' $window

# ---------------------------------------------------------------------
# Select a drawing path by clicking just inside the outer profile
# ---------------------------------------------------------------------

$selected = $false
foreach ($y in 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126) {
    Click-Client 400 (69 + $y)
    $status = Read-Text $window 'StatusSelection'
    if ($status -like '1 path*') { $selected = $true; break }
}
if (-not $selected) { throw 'Could not select a path by clicking the canvas' }
Write-Output "PASS canvas click selected a path"
Shot '06-path-selected' $window

# ---------------------------------------------------------------------
# Undo/redo the example load
# ---------------------------------------------------------------------

Press-Keys '^z'
Assert-Equal 'No operations yet' (Read-Text $window 'OpCount') 'undo example'
Press-Keys '^y'
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'redo example'

# ---------------------------------------------------------------------
# Copy / paste / delete and operation reordering
# ---------------------------------------------------------------------

Press-Keys 'f'
Press-Keys '^a'
Assert-Equal '4 paths selected' (Read-Text $window 'StatusSelection') 'select all paths'
Press-Keys '^c'
Press-Keys '^v'
Assert-Equal '4 paths selected' (Read-Text $window 'StatusSelection') 'paste selects copies'
Press-Keys '{DELETE}'
Assert-Equal '0 paths selected' (Read-Text $window 'StatusSelection') 'delete pasted paths'
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'operations survive path delete'
Press-Keys '^z'
Press-Keys '^z'
Assert-Equal '4 paths selected' (Read-Text $window 'StatusSelection') 'undo restores paths'
Write-Output 'PASS copy/paste/delete'

$orderBefore = (Get-OpOrder $window) -join '|'
$downGlyph = [string][char]0x2193
$downs = $window.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    (New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, $downGlyph)),
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Button)))))
if ($downs.Count -lt 3) { throw 'Operation down buttons not found' }
$firstDown = @($downs | Sort-Object { $_.Current.BoundingRectangle.Y })[0]
$firstDown.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 600
$orderAfter = (Get-OpOrder $window) -join '|'
if ($orderAfter -eq $orderBefore) { throw 'Reordering did not change the list' }
Write-Output "PASS reorder: $orderBefore -> $orderAfter"
Press-Keys '^z'
$orderRestored = (Get-OpOrder $window) -join '|'
Assert-Equal $orderBefore $orderRestored 'reorder undo'

# ---------------------------------------------------------------------
# Preferences, scale and Add-tabs dialogs through the menus
# ---------------------------------------------------------------------

Expand-Menu $proc.Id 'Edit'
Invoke-MenuItem $proc.Id '^Preferences'
$dialog = Find-Window 'Preferences'
if ($null -eq $dialog) { throw 'Preferences dialog did not open' }
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 600
if ($null -ne (Find-Window 'Preferences')) { throw 'Preferences dialog did not close' }
Write-Output 'PASS preferences dialog'

Expand-Menu $proc.Id 'Edit'
Invoke-MenuItem $proc.Id '^Scale'
$dialog = Find-Window 'Scale selection'
if ($null -eq $dialog) { throw 'Scale dialog did not open' }
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 600
if ($null -ne (Find-Window 'Scale selection')) { throw 'Scale dialog did not close' }
Write-Output 'PASS scale dialog'

$profileText = Find-TextByName $window 'Plate outline'
if ($null -eq $profileText) { throw 'Profile operation card not found' }
$rect = $profileText.Current.BoundingRectangle
Click-Screen ([int]($rect.X + 20)) ([int]($rect.Y + 8))
Expand-Menu $proc.Id 'CAM'
Invoke-MenuItem $proc.Id '^Add tabs'
$dialog = Find-Window 'Add tabs'
if ($null -eq $dialog) { throw 'Add tabs dialog did not open' }
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 600
if ($null -ne (Find-Window 'Add tabs')) { throw 'Add tabs dialog did not close' }
Write-Output 'PASS add-tabs dialog'

# ---------------------------------------------------------------------
# Save and reopen through the native file dialogs
# ---------------------------------------------------------------------

$savePath = Join-Path $env:TEMP 'makercam-smoke-project.svg'
if (Test-Path $savePath) { Remove-Item $savePath -Force }

Press-Keys '^s'
Start-Sleep -Milliseconds 1200
$saveDialog = Find-Window 'Save project'
if ($null -eq $saveDialog) { $saveDialog = Find-WindowLike '^Save' }
if ($null -eq $saveDialog) { throw 'Save dialog did not open' }
Send-RawKeys '^a'
Send-RawKeys $savePath
Send-RawKeys '{ENTER}'
Start-Sleep -Milliseconds 1800
if (-not (Test-Path $savePath)) { throw 'Save did not create the file' }
if ((Get-Content $savePath -Raw) -notmatch '<partkam-project') { throw 'Saved file lacks CAM metadata' }
$savedText = Get-Content $savePath -Raw
if ($savedText -notmatch 'width="140mm"' -or $savedText -notmatch 'height="90mm"') {
    throw 'The saved project did not preserve the example page size (140x90 mm)'
}
Write-Output 'PASS save through native dialog'
Write-Output 'PASS original page size preserved'

Press-Keys '^o'
Start-Sleep -Milliseconds 1200
$openDialog = Find-Window 'Open SVG or MakerCam project'
if ($null -eq $openDialog) { $openDialog = Find-WindowLike '^Open' }
if ($null -eq $openDialog) { throw 'Open dialog did not open' }
Send-RawKeys '^a'
Send-RawKeys $savePath
Send-RawKeys '{ENTER}'
Start-Sleep -Milliseconds 2000
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'open through native dialog'
Write-Output 'PASS open through native dialog'

# ---------------------------------------------------------------------
# Reopen the same file from File -> Recent Files
# ---------------------------------------------------------------------

Expand-Menu $proc.Id 'File'
$recentMenu = Find-MenuItemGlobal $proc.Id '^Recent Files$'
if ($null -eq $recentMenu) { throw 'Recent Files menu not found' }
try {
    $recentMenu.GetCurrentPattern(
        [System.Windows.Automation.ExpandCollapsePattern]::Pattern).Expand()
}
catch {
    $recentMenu.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
}
Start-Sleep -Milliseconds 500

$recentItem = Find-MenuItemGlobal $proc.Id '^makercam-smoke-project\.svg$'
if ($null -eq $recentItem) { throw 'Recently opened file is not listed in File -> Recent Files' }
$recentItem.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 2000
Assert-Equal '3 operations' (Read-Text $window 'OpCount') 'recent file reopened'
Write-Output 'PASS recent files menu'

# ---------------------------------------------------------------------
# Marquee-select across the plate, wheel zoom, and tool shortcuts
# ---------------------------------------------------------------------

$clientRect = New-Object RECT
[Native]::GetClientRect([IntPtr]$script:hwnd, [ref]$clientRect) | Out-Null
$canvasWidth = ($clientRect.Right - $clientRect.Left) - 311
$canvasHeight = ($clientRect.Bottom - $clientRect.Top) - 99
Drag-Client 20 (69 + 20) ($canvasWidth - 20) (69 + $canvasHeight - 20)
$selectionText = Read-Text $window 'StatusSelection'
for ($i = 0; $i -lt 8 -and $selectionText -like '0 paths*'; $i++) {
    Start-Sleep -Milliseconds 300
    $selectionText = Read-Text $window 'StatusSelection'
}
if ($selectionText -notmatch '^(\d+) path') { throw "Unexpected selection text '$selectionText'" }
$marqueeCount = [int]$Matches[1]
if ($marqueeCount -lt 1) { throw 'Marquee selection selected nothing' }
Write-Output "PASS marquee selected $marqueeCount paths"

$zoomBefore = Read-Text $window 'StatusZoom'
Wheel 120
$zoomAfter = Read-Text $window 'StatusZoom'
if ($zoomBefore -eq $zoomAfter) { throw "Wheel zoom did not change ($zoomBefore)" }
Write-Output "PASS wheel zoom $zoomBefore -> $zoomAfter"

Press-Keys 'h'
$panToggle = (Find-ById $window 'ToolPan').GetCurrentPattern(
    [System.Windows.Automation.TogglePattern]::Pattern)
Assert-Equal 'On' $panToggle.Current.ToggleState 'pan tool shortcut'
Press-Keys 'v'
$selectToggle = (Find-ById $window 'ToolSelect').GetCurrentPattern(
    [System.Windows.Automation.TogglePattern]::Pattern)
Assert-Equal 'On' $selectToggle.Current.ToggleState 'select tool shortcut'

# ---------------------------------------------------------------------
# Draw a pen path and finish it with Enter
# ---------------------------------------------------------------------

Press-Keys 'p'
Click-Client 200 (69 + 200)
Click-Client 300 (69 + 250)
Click-Client 400 (69 + 200)
Press-Keys '{ENTER}'
Assert-Equal '1 path selected' (Read-Text $window 'StatusSelection') 'pen path created'
Press-Keys '^z'
Press-Keys 'v'

# ---------------------------------------------------------------------
# Toggle the grid
# ---------------------------------------------------------------------

$grid = Find-ById $window 'GridToggle'
$toggle = $grid.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
$before = $toggle.Current.ToggleState
$toggle.Toggle()
Start-Sleep -Milliseconds 400
$after = $toggle.Current.ToggleState
if ($before -eq $after) { throw 'Grid toggle did not change state' }
Write-Output "PASS grid toggle $before -> $after"
$toggle.Toggle()
Start-Sleep -Milliseconds 300

# ---------------------------------------------------------------------
# Open the operation edit dialog via its pencil button
# ---------------------------------------------------------------------

Shot '07-before-edit' $window
$editGlyph = [string][char]0x270E
$pencils = $window.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    (New-Object System.Windows.Automation.AndCondition(
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, $editGlyph)),
        (New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
            [System.Windows.Automation.ControlType]::Button)))))
if ($pencils.Count -eq 0) { throw 'Edit button not found' }
$pencils[0].GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
Start-Sleep -Milliseconds 900

$dialog = Find-Window 'Edit drill'
if ($null -eq $dialog) { throw 'Edit dialog did not open' }
Shot '08-edit-dialog' $dialog
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 600
if ($null -ne (Find-Window 'Edit drill')) { throw 'Edit dialog did not close' }
Write-Output 'PASS edit dialog opened and closed'

# ---------------------------------------------------------------------
# Open the G-code export dialog
# ---------------------------------------------------------------------

Invoke-Button $window 'Export G-code'
$dialog = Find-Window 'Export G-code'
if ($null -eq $dialog) { throw 'Export dialog did not open' }
Shot '09-export-dialog' $dialog
[System.Windows.Forms.SendKeys]::SendWait('{ESC}')
Start-Sleep -Milliseconds 500
if ($null -ne (Find-Window 'Export G-code')) { throw 'Export dialog did not close' }
Write-Output 'PASS export dialog opened and closed'

# ---------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------

Shot '10-final' $window

# ---------------------------------------------------------------------
# Unsaved-changes prompt: dirty title, Cancel keeps the app, No discards
# ---------------------------------------------------------------------

Press-Keys 'p'
Click-Client 200 (69 + 200)
Click-Client 300 (69 + 250)
Press-Keys '{ENTER}'
Start-Sleep -Milliseconds 500
if ($window.Current.Name -notlike 'MakerCam Modern *') {
    throw "Dirty title marker missing (title is '$($window.Current.Name)')"
}
Write-Output 'PASS dirty title marker'

Press-Keys '%{F4}'
$prompt = Find-Window 'MakerCam'
if ($null -eq $prompt) { throw 'Close prompt did not appear' }
Shot '11-close-prompt' $prompt
Click-DialogButton 2
Start-Sleep -Milliseconds 500
$proc.Refresh()
if ($proc.HasExited) { throw 'Cancel closed the application' }
if ($null -ne (Find-Window 'MakerCam')) { throw 'Close prompt stayed open after Cancel' }
Write-Output 'PASS close prompt Cancel'

Press-Keys '%{F4}'
$prompt = Find-Window 'MakerCam'
if ($null -eq $prompt) { throw 'Close prompt did not reappear' }
Click-DialogButton 7
Start-Sleep -Milliseconds 1200
$proc.Refresh()
if (-not $proc.HasExited) {
    $proc.Kill()
    throw 'Discard did not close the application'
}
Write-Output 'PASS close prompt Discard'
Remove-Item $savePath -Force -ErrorAction SilentlyContinue
Write-Output 'SMOKE OK'
