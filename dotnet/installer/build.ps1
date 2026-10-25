param(
    [string]$Configuration = 'Release',
    [string]$Version = '1.0.0',
    [string]$SignThumbprint,
    [string]$PfxPath,
    [string]$PfxPassword,
    [switch]$SkipSign,
    [string]$TimestampServer = 'http://timestamp.digicert.com'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Resolve-Path (Join-Path $here '..\..')
$publish = Join-Path $here 'publish'
$artifacts = Join-Path $here 'artifacts'
$msi = Join-Path $artifacts "MakerCam-$Version-x64.msi"
$exe = Join-Path $publish 'MakerCam.exe'

# WiX 5 is pinned in dotnet/.config/dotnet-tools.json. WiX 6+ requires the
# Open Source Maintenance Fee EULA, so 5.x is used deliberately.
$wixVersion = '5.0.2'
$uiExtension = Join-Path $env:USERPROFILE ".wix\extensions\WixToolset.UI.wixext\$wixVersion\wixext5\WixToolset.UI.wixext.dll"

function Resolve-SigningCertificate {
    if ($PfxPath) {
        if (-not (Test-Path $PfxPath)) { throw "PFX file not found: $PfxPath" }
        $flags = [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable -bor
                 [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::PersistKeySet
        $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
            (Resolve-Path $PfxPath).Path, $PfxPassword, $flags)
        if (-not $certificate.HasPrivateKey) { throw 'The PFX does not contain a private key.' }
        return $certificate
    }

    if ($SignThumbprint) {
        $certificate = Get-ChildItem "Cert:\CurrentUser\My\$SignThumbprint" -ErrorAction Stop
        if (-not $certificate.HasPrivateKey) { throw 'The certificate has no private key.' }
        return $certificate
    }

    throw 'No signing certificate supplied. Use -SignThumbprint or -PfxPath, or omit both for an unsigned build.'
}

function Invoke-Sign([string]$path, $certificate) {
    $signature = $null
    try {
        $signature = Set-AuthenticodeSignature -FilePath $path -Certificate $certificate `
            -HashAlgorithm SHA256 -TimestampServer $TimestampServer
    }
    catch {
        Write-Warning "Timestamping failed ($($_.Exception.Message)); signing without a timestamp."
        $signature = Set-AuthenticodeSignature -FilePath $path -Certificate $certificate -HashAlgorithm SHA256
    }

    $check = Get-AuthenticodeSignature $path
    if ($check.SignatureType -ne 'Authenticode') {
        throw "Signing failed for $path ($($check.Status): $($check.StatusMessage))"
    }
    Write-Host "Signed $path (status: $($check.Status))"
    if ($check.Status -ne 'Valid') {
        Write-Warning 'The signature is not trusted on this machine. Use a CA-issued certificate for distribution.'
    }
}

if (Test-Path $publish) { Remove-Item $publish -Recurse -Force }
if (Test-Path $artifacts) { Remove-Item $artifacts -Recurse -Force }
New-Item -ItemType Directory -Force $publish | Out-Null
New-Item -ItemType Directory -Force $artifacts | Out-Null

$certificate = $null
$sign = (-not $SkipSign) -and ($SignThumbprint -or $PfxPath)
if ($sign) {
    $certificate = Resolve-SigningCertificate
    Write-Host "Signing certificate: $($certificate.Subject) [$($certificate.Thumbprint)]"
}
else {
    Write-Host 'Building unsigned (no signing certificate supplied).'
}

Write-Host 'Publishing self-contained application...'
dotnet publish (Join-Path $repo 'dotnet\src\MakerCam.App') `
    -c $Configuration -r win-x64 --self-contained true `
    -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:DebugType=None -p:DebugSymbols=false `
    -p:Version=$Version -p:AssemblyVersion=$Version -p:FileVersion=$Version `
    -o $publish -v q --nologo

if ($null -ne $certificate) { Invoke-Sign $exe $certificate }

Push-Location $here
try {
    Write-Host 'Restoring WiX...'
    dotnet tool restore | Out-Null

    if (-not (Test-Path $uiExtension)) {
        dotnet tool run wix extension add -g "WixToolset.UI.wixext/$wixVersion" | Out-Null
    }
    if (-not (Test-Path $uiExtension)) {
        throw "WiX UI extension not found at $uiExtension"
    }

    Write-Host "Building $msi ..."
    dotnet tool run wix build MakerCam.wxs `
        -arch x64 `
        -ext $uiExtension `
        -d "Version=$Version" `
        -o $msi
}
finally {
    Pop-Location
}

if ($null -ne $certificate) { Invoke-Sign $msi $certificate }

$size = [math]::Round((Get-Item $msi).Length / 1MB, 1)
Write-Host "Installer: $msi ($size MB)"
