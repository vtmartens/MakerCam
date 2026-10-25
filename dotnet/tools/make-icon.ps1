param(
    [string]$Output = (Join-Path $PSScriptRoot '..\src\MakerCam.App\Assets\MakerCam.ico')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outputPath = [System.IO.Path]::GetFullPath($Output)
$outputDir = Split-Path -Parent $outputPath
New-Item -ItemType Directory -Force $outputDir | Out-Null

function New-IconBitmap([int]$size) {
    $s = $size / 24.0
    $bmp = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded square from the web app's brand mark.
    $x = 1 * $s; $y = 1 * $s; $w = 22 * $s; $h = 22 * $s; $r = 5 * $s
    $d = 2 * $r
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddArc([float]$x, [float]$y, [float]$d, [float]$d, 180, 90)
    $path.AddArc([float]($x + $w - $d), [float]$y, [float]$d, [float]$d, 270, 90)
    $path.AddArc([float]($x + $w - $d), [float]($y + $h - $d), [float]$d, [float]$d, 0, 90)
    $path.AddArc([float]$x, [float]($y + $h - $d), [float]$d, [float]$d, 90, 90)
    $path.CloseFigure()

    $rect = [System.Drawing.RectangleF]::new([float]$x, [float]$y, [float]$w, [float]$h)
    $c1 = [System.Drawing.Color]::FromArgb(255, 10, 132, 255)
    $c2 = [System.Drawing.Color]::FromArgb(255, 0, 89, 179)
    $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, $c1, $c2, [float]145)
    $g.FillPath($brush, $path)

    # Isometric cube outline, matching the favicon.
    $stroke = [Math]::Max(1.1, 1.5 * $s)
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, [float]$stroke)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    $cube = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new([float](12 * $s), [float](2 * $s)),
        [System.Drawing.PointF]::new([float](3 * $s),  [float](7 * $s)),
        [System.Drawing.PointF]::new([float](3 * $s),  [float](17 * $s)),
        [System.Drawing.PointF]::new([float](12 * $s), [float](22 * $s)),
        [System.Drawing.PointF]::new([float](21 * $s), [float](17 * $s)),
        [System.Drawing.PointF]::new([float](21 * $s), [float](7 * $s))
    )
    $g.DrawPolygon($pen, $cube)
    $g.DrawLine($pen, [float](12 * $s), [float](7 * $s), [float](12 * $s), [float](17 * $s))
    $g.DrawLine($pen, [float](7.5 * $s), [float](9.5 * $s), [float](7.5 * $s), [float](14.5 * $s))
    $g.DrawLine($pen, [float](16.5 * $s), [float](9.5 * $s), [float](16.5 * $s), [float](14.5 * $s))

    $g.Dispose(); $brush.Dispose(); $pen.Dispose(); $path.Dispose()
    return $bmp
}

function New-IconPng([int]$size) {
    $bmp = New-IconBitmap $size
    $stream = [System.IO.MemoryStream]::new()
    $bmp.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $bytes = $stream.ToArray()
    $stream.Dispose()
    return ,$bytes
}

# Windows Installer (ARPPRODUCTICON) and older shell code only understand
# uncompressed DIB entries, so use those for the small sizes and PNG for large.
function New-IconDib([int]$size) {
    $bmp = New-IconBitmap $size
    $stream = [System.IO.MemoryStream]::new()
    $writer = [System.IO.BinaryWriter]::new($stream)

    $writer.Write([int32]40)              # BITMAPINFOHEADER size
    $writer.Write([int32]$size)           # width
    $writer.Write([int32]($size * 2))     # height: XOR + AND masks
    $writer.Write([int16]1)               # planes
    $writer.Write([int16]32)              # bits per pixel
    $writer.Write([int32]0)               # BI_RGB
    $writer.Write([int32]($size * $size * 4))
    $writer.Write([int32]0)
    $writer.Write([int32]0)
    $writer.Write([int32]0)
    $writer.Write([int32]0)

    # Bottom-up BGRA pixels.
    for ($row = 0; $row -lt $size; $row++) {
        for ($col = 0; $col -lt $size; $col++) {
            $c = $bmp.GetPixel($col, $size - 1 - $row)
            $writer.Write([byte]$c.B)
            $writer.Write([byte]$c.G)
            $writer.Write([byte]$c.R)
            $writer.Write([byte]$c.A)
        }
    }

    # AND mask: 1bpp, rows padded to 4 bytes, all zero (fully opaque).
    $maskRow = [int]([Math]::Ceiling($size / 32.0) * 4)
    $writer.Write([byte[]]::new($maskRow * $size))
    $writer.Flush()

    $bytes = $stream.ToArray()
    $writer.Dispose(); $stream.Dispose(); $bmp.Dispose()
    return ,$bytes
}

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$entries = @()
foreach ($size in $sizes) {
    $bytes = if ($size -le 64) { New-IconDib $size } else { New-IconPng $size }
    $entries += ,@{ Size = $size; Bytes = $bytes }
}

$file = [System.IO.File]::Create($outputPath)
$writer = [System.IO.BinaryWriter]::new($file)
$writer.Write([UInt16]0)                 # reserved
$writer.Write([UInt16]1)                 # type: icon
$writer.Write([UInt16]$sizes.Count)

$offset = 6 + 16 * $sizes.Count
foreach ($entry in $entries) {
    $size = $entry.Size
    $bytes = $entry.Bytes
    $dimension = if ($size -ge 256) { 0 } else { $size }
    $writer.Write([byte]$dimension)
    $writer.Write([byte]$dimension)
    $writer.Write([byte]0)               # palette
    $writer.Write([byte]0)               # reserved
    $writer.Write([UInt16]1)             # planes
    $writer.Write([UInt16]32)            # bits per pixel
    $writer.Write([UInt32]$bytes.Length)
    $writer.Write([UInt32]$offset)
    $offset += $bytes.Length
}
foreach ($entry in $entries) { $writer.Write($entry.Bytes) }
$writer.Close()
$file.Close()

$icon = [System.Drawing.Icon]::new($outputPath, 32, 32)
$bitmap = $icon.ToBitmap()
Write-Host "Wrote $outputPath ($((Get-Item $outputPath).Length) bytes; 32px entry converts: $($bitmap.Width)x$($bitmap.Height))"
$bitmap.Dispose()
$icon.Dispose()
