#Requires -Version 5.1
<#
.SYNOPSIS
    Removes legacy MakerCam tool-change lines (T.. M6) from G-code files so GRBL accepts them.

.DESCRIPTION
    Older MakerCam builds wrote a line such as "T0 M6" before each cutter change.
    Stock GRBL 1.1 rejects M6 with error 20 ("unsupported or invalid command"),
    so those files stop before cutting.

    By default this script deletes the entire matching line. With -KeepComment
    it replaces the line with a GRBL-safe comment such as
    "(tool change: T0 M6)", preserving the information without the error.

    Matching is limited to lines made up only of T<number> and M6 words (plus an
    optional parenthesized comment), which is the format MakerCam emitted. It
    does not alter motion, spindle or other commands. Use -WhatIf to preview.

    Note: deleting a tool-change line also removes the stop it represented. For
    a multi-tool job, re-export from the current MakerCam version (which inserts
    M5/M0 pauses) or add the pauses manually.

.PARAMETER Path
    One or more files, wildcards or directories. Directories are searched for
    .nc, .gcode, .gco, .tap and .ngc files; add -Recurse for subdirectories.

.PARAMETER Recurse
    Also search subdirectories when a directory is supplied.

.PARAMETER KeepComment
    Replace each removed line with "(tool change: <original line>)" instead of
    deleting it.

.PARAMETER Backup
    Copy each modified file to "<name>.bak" before writing it.

.EXAMPLE
    .\scripts\strip-toolchanges.ps1 .\part.nc -WhatIf

.EXAMPLE
    .\scripts\strip-toolchanges.ps1 .\jobs -Recurse -Backup

.EXAMPLE
    .\scripts\strip-toolchanges.ps1 .\part.nc -KeepComment
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true, Position = 0, ValueFromRemainingArguments = $true)]
    [string[]] $Path,

    [switch] $Recurse,

    [switch] $KeepComment,

    [switch] $Backup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$extensions = @('.nc', '.gcode', '.gco', '.tap', '.ngc')

# A line consisting only of tool-change words: T<number> and/or M6, optionally
# followed by a parenthesized comment. This is what MakerCam wrote ("T0 M6").
$toolChangeLine = [regex]::new(
    '^[ \t]*(?:(?:T\d+|M0?6)[ \t]*)+(?:\([^)]*\)[ \t]*)?$',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

$files = [System.Collections.Generic.List[System.IO.FileInfo]]::new()

foreach ($entry in $Path) {
    $resolved = @(Resolve-Path -Path $entry -ErrorAction SilentlyContinue)
    if ($resolved.Count -eq 0) {
        Write-Warning "No match: $entry"
        continue
    }

    foreach ($match in $resolved) {
        $item = Get-Item -LiteralPath $match.Path
        if ($item.PSIsContainer) {
            Get-ChildItem -LiteralPath $item.FullName -File -Recurse:$Recurse |
                Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
                ForEach-Object { $files.Add($_) }
        }
        else {
            $files.Add($item)
        }
    }
}

$files = @($files | Sort-Object -Property FullName -Unique)
if ($files.Count -eq 0) {
    Write-Error 'No G-code files found.' -ErrorAction Continue
    exit 1
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$changedFiles = 0
$removedTotal = 0
$failed = 0

foreach ($file in $files) {
    try {
        $text = [System.IO.File]::ReadAllText($file.FullName)

        # Keep the file's dominant line ending and whether it ended with one.
        $newline = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
        $hadFinalNewline = $text.EndsWith("`n")
        $lines = $text -split "\r?\n"
        if ($hadFinalNewline) {
            $lines = $lines[0..($lines.Count - 2)]
        }

        $kept = [System.Collections.Generic.List[string]]::new()
        $removed = 0

        foreach ($line in $lines) {
            if ($toolChangeLine.IsMatch($line)) {
                $removed++
                if ($KeepComment) {
                    # GRBL comments cannot be nested, so remove any parentheses
                    # that came from the original line before wrapping it.
                    $original = (($line.Trim() -replace '[()]', ' ') -replace '\s+', ' ').Trim()
                    $kept.Add("(tool change: $original)")
                }
            }
            else {
                $kept.Add($line)
            }
        }

        if ($removed -eq 0) {
            Write-Verbose "No tool-change lines: $($file.FullName)"
            continue
        }

        $newText = [string]::Join($newline, $kept)
        if ($hadFinalNewline) {
            $newText += $newline
        }

        if ($PSCmdlet.ShouldProcess($file.FullName, "Strip $removed tool-change line(s)")) {
            if ($Backup) {
                Copy-Item -LiteralPath $file.FullName -Destination ($file.FullName + '.bak') -Force
            }
            [System.IO.File]::WriteAllText($file.FullName, $newText, $utf8NoBom)
            Write-Host ("Stripped {0} line(s): {1}" -f $removed, $file.FullName)
        }
        else {
            Write-Host ("Would strip {0} line(s): {1}" -f $removed, $file.FullName)
        }

        $changedFiles++
        $removedTotal += $removed
    }
    catch {
        Write-Error ("Failed to process {0}: {1}" -f $file.FullName, $_.Exception.Message) -ErrorAction Continue
        $failed++
    }
}

Write-Host ("Done. Matched {0} tool-change line(s) in {1} file(s)." -f $removedTotal, $changedFiles)
if ($failed -gt 0) {
    exit 1
}
