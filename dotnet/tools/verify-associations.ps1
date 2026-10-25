param(
    [string]$TestFile = (Join-Path $PSScriptRoot '..\..\tools\screens\saved-project.svg'),
    [string]$Version = '1.0.0'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class Assoc
{
    [DllImport("shlwapi.dll", EntryPoint = "AssocQueryStringW", CharSet = CharSet.Unicode, ExactSpelling = true)]
    private static extern int AssocQueryString(uint flags, uint str, string assoc, string extra, StringBuilder buffer, ref uint length);

    [DllImport("shell32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool ShellExecuteEx(ref SHELLEXECUTEINFO info);

    [DllImport("kernel32.dll")]
    private static extern uint GetProcessId(IntPtr process);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct SHELLEXECUTEINFO
    {
        public int cbSize;
        public uint fMask;
        public IntPtr hwnd;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpVerb;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpParameters;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpDirectory;
        public int nShow;
        public IntPtr hInstApp;
        public IntPtr lpIDList;
        [MarshalAs(UnmanagedType.LPWStr)] public string lpClass;
        public IntPtr hkeyClass;
        public uint dwHotKey;
        public IntPtr hIcon;
        public IntPtr hProcess;
    }

    public static string Query(uint str, string assoc, string extra)
    {
        uint length = 1024;
        var buffer = new StringBuilder((int)length);
        var result = AssocQueryString(0, str, assoc, extra, buffer, ref length);
        return result == 0 ? buffer.ToString() : null;
    }

    public static int ShellOpen(string file, string progId)
    {
        var info = new SHELLEXECUTEINFO
        {
            cbSize = Marshal.SizeOf(typeof(SHELLEXECUTEINFO)),
            fMask = 0x00000040 | 0x00000001, // NOCLOSEPROCESS | CLASSNAME
            lpVerb = "open",
            lpFile = file,
            lpClass = progId,
            nShow = 1,
        };
        if (!ShellExecuteEx(ref info)) return -Marshal.GetLastWin32Error();
        return (int)GetProcessId(info.hProcess);
    }
}

[ComImport, Guid("973810ae-9599-4b88-9e4d-6ee98c9552da"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IEnumAssocHandlersRaw
{
    [PreserveSig] int Next(uint celt, out IAssocHandlerRaw rgelt, out uint pceltFetched);
}

[ComImport, Guid("f04061ac-1659-4a3f-a954-775aa57fc083"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAssocHandlerRaw
{
    [PreserveSig] int GetName(out IntPtr ppsz);
    [PreserveSig] int GetUIName(out IntPtr ppsz);
}

public static class ShellHandlers
{
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern int SHAssocEnumHandlers(string extension, int filter, out IEnumAssocHandlersRaw handlers);

    /// <summary>Returns the friendly names Explorer shows in "Open with".</summary>
    public static string[] ForExtension(string extension)
    {
        var names = new System.Collections.Generic.List<string>();
        IEnumAssocHandlersRaw handlers;
        if (SHAssocEnumHandlers(extension, 0, out handlers) != 0 || handlers == null) return names.ToArray();

        for (var i = 0; i < 100; i++)
        {
            IAssocHandlerRaw handler;
            uint fetched;
            if (handlers.Next(1, out handler, out fetched) != 0 || fetched == 0 || handler == null) break;
            IntPtr name;
            IntPtr uiName;
            handler.GetName(out name);
            if (handler.GetUIName(out uiName) == 0 && uiName != IntPtr.Zero)
            {
                names.Add(Marshal.PtrToStringUni(uiName));
                Marshal.FreeCoTaskMem(uiName);
            }
            if (name != IntPtr.Zero) Marshal.FreeCoTaskMem(name);
        }
        return names.ToArray();
    }
}
"@

function Assert-True([bool]$condition, [string]$message) {
    if (-not $condition) { throw "FAIL: $message" }
    Write-Output "PASS $message"
}

$installDir = Join-Path $env:ProgramFiles 'MakerCam'
$exe = Join-Path $installDir 'MakerCam.exe'
$license = Join-Path $installDir 'LICENSE'

Assert-True (Test-Path $exe) "installed executable exists: $exe"
Assert-True (Test-Path $license) 'license file installed'
Assert-True ((Get-Item $exe).VersionInfo.FileVersion -like "$Version*") "installed file version = $((Get-Item $exe).VersionInfo.FileVersion)"

$signature = Get-AuthenticodeSignature $exe
if ($signature.SignatureType -eq 'Authenticode') {
    Write-Output "INFO installed exe is Authenticode-signed (trust: $($signature.Status))"
}
else {
    Write-Output 'INFO installed exe is unsigned (expected for personal builds)'
}

$uninstall = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
) |
    Where-Object { Test-Path $_ } |
    ForEach-Object { Get-ChildItem $_ } |
    ForEach-Object { Get-ItemProperty $_.PSPath } |
    Where-Object { $_.DisplayName -eq 'MakerCam' } |
    Select-Object -First 1

Assert-True ($null -ne $uninstall) 'Apps & Features entry exists'
Assert-True ($uninstall.DisplayName -eq 'MakerCam') "uninstall DisplayName = $($uninstall.DisplayName)"
Assert-True ($uninstall.DisplayVersion -eq $Version) "uninstall DisplayVersion = $($uninstall.DisplayVersion)"

# Windows caches the ARPPRODUCTICON icon under the product code; DisplayIcon is
# not always written as a registry value, so check the extracted icon instead.
$cachedIcon = Join-Path $env:WINDIR "Installer\$($uninstall.PSChildName)\MakerCamIcon"
Assert-True (Test-Path $cachedIcon) "product icon cached at $cachedIcon"

$shortcut = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\MakerCam.lnk'
Assert-True (Test-Path $shortcut) 'Start menu shortcut installed'

$progIdKey = 'HKLM:\Software\Classes\MakerCam.Project'
$command = (Get-Item "$progIdKey\shell\open\command").GetValue('')
$defaultIcon = (Get-Item $progIdKey).GetValue('DefaultIcon')
$description = (Get-Item $progIdKey).GetValue('')
Assert-True ($description -eq 'MakerCam Project') "ProgID description = $description"
Assert-True ($command -like "*$exe*%1*") "ProgID open command = $command"
Assert-True ($defaultIcon -like "*$exe*") "ProgID default icon = $defaultIcon"

$openWith = (Get-Item 'HKLM:\Software\Classes\.svg\OpenWithProgids').GetValue('MakerCam.Project')
Assert-True ($null -ne $openWith) '.svg OpenWithProgids entry exists'

$appKey = 'HKLM:\Software\Classes\Applications\MakerCam.exe'
$friendly = (Get-Item $appKey).GetValue('FriendlyAppName')
$appCommand = (Get-Item "$appKey\shell\open\command").GetValue('')
$appRoot = [Microsoft.Win32.Registry]::LocalMachine.OpenSubKey('Software\Classes\Applications\MakerCam.exe')
if ($null -eq $appRoot) { throw 'FAIL: Applications key missing' }
$supportedTypes = $appRoot.OpenSubKey('SupportedTypes')
$supported = if ($null -ne $supportedTypes) { $supportedTypes.GetValue('.svg') } else { $null }
if ($null -ne $supportedTypes) { $supportedTypes.Close() }
$appRoot.Close()
Assert-True ($friendly -eq 'MakerCam') "Applications FriendlyAppName = $friendly"
Assert-True ($appCommand -like "*$exe*%1*") "Applications command = $appCommand"
Assert-True ($null -ne $supported) 'Applications SupportedTypes includes .svg'

# Shell resolution. AssocQueryString does not resolve an OpenWith-only ProgID
# on this Windows build, so the real proof is the shell handler list and the
# ShellExecuteEx launch below.
$handlers = [ShellHandlers]::ForExtension('.svg')
Write-Output "INFO .svg Open With handlers: $($handlers -join ', ')"
Assert-True ($handlers -contains 'MakerCam') 'MakerCam is listed in the .svg Open With handlers'

$defaultFriendly = [Assoc]::Query(4, '.svg', $null)   # ASSOCSTR_FRIENDLYAPPNAME
Write-Output "INFO default .svg handler remains: $defaultFriendly"
Assert-True ($defaultFriendly -ne 'MakerCam') 'MakerCam did not take over the default .svg handler'

# Launch through the ProgID, exactly as Explorer's Open With does.
$testPath = (Resolve-Path $TestFile).Path
$pidLaunched = [Assoc]::ShellOpen($testPath, 'MakerCam.Project')
Assert-True ($pidLaunched -gt 0) "ShellExecuteEx opened the ProgID (PID $pidLaunched)"

$process = Get-Process -Id $pidLaunched -ErrorAction Stop
$deadline = (Get-Date).AddSeconds(15)
while ($process.MainWindowHandle -eq [IntPtr]::Zero -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 300
    $process.Refresh()
}
Assert-True ($process.MainWindowHandle -ne [IntPtr]::Zero) 'MakerCam window opened from the association'

Start-Sleep -Milliseconds 800
$windowCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $process.Id)
$window = [System.Windows.Automation.AutomationElement]::RootElement.FindFirst(
    [System.Windows.Automation.TreeScope]::Children, $windowCondition)
Assert-True ($null -ne $window) 'automation found the launched window'

$opCountCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::AutomationIdProperty, 'OpCount')
$opCount = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $opCountCondition)
Assert-True ($opCount.Current.Name -eq '3 operations') "association opened the project ($($opCount.Current.Name))"

$window.SetFocus()
$process.CloseMainWindow() | Out-Null
Start-Sleep -Milliseconds 1500
if (-not $process.HasExited) { $process.Kill() }

Write-Output 'ASSOCIATION TEST OK'
