param(
    [Parameter(Mandatory = $true)][int]$ProcessId,
    [Parameter(Mandatory = $true)][string]$OutFile
)

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECT { public int Left, Top, Right, Bottom; }
public static class WinCap {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

$proc = Get-Process -Id $ProcessId
$proc.Refresh()
$handle = $proc.MainWindowHandle
if ($handle -eq [IntPtr]::Zero) { throw "No main window for process $ProcessId" }

[WinCap]::ShowWindow($handle, 9) | Out-Null
[WinCap]::SetForegroundWindow($handle) | Out-Null
Start-Sleep -Milliseconds 700

$rect = New-Object RECT
[WinCap]::GetWindowRect($handle, [ref]$rect) | Out-Null
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
$graphics.Dispose()
$bitmap.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
Write-Output "Saved $OutFile ($width x $height)"
