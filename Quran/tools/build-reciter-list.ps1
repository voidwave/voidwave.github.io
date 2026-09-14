<#
.SYNOPSIS
    Builds QuranAudio/reciters.json from the reciter folders.

.DESCRIPTION
    Scans the QuranAudio folder and writes a JSON list of the reciters for the
    picker in the app. The folder name becomes the id, and the display name is
    the folder name with "-" and "_" turned into spaces.

    Run this again after adding, renaming or removing reciter folders. Each
    folder is expected to hold the ayah files as <sura><ayah>.mp3 with three
    digits each, for example 002255.mp3, plus a <sura>000.mp3 basmala file.

.EXAMPLE
    ./tools/build-reciter-list.ps1
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$audioRoot = Join-Path $root 'QuranAudio'
$target = Join-Path $audioRoot 'reciters.json'

if (-not (Test-Path $audioRoot)) {
    throw "The folder $audioRoot does not exist."
}

$reciters = @(Get-ChildItem -Directory -Path $audioRoot | Sort-Object Name | ForEach-Object {
    [pscustomobject]@{
        id   = $_.Name
        name = ($_.Name -replace '[-_]+', ' ').Trim()
    }
})

if ($reciters.Count -eq 0) {
    throw "No reciter folders were found in $audioRoot."
}

$json = ConvertTo-Json -InputObject $reciters -Depth 2
[System.IO.File]::WriteAllText($target, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ("Wrote {0} reciters to {1}" -f $reciters.Count, $target)
$reciters | ForEach-Object { Write-Host ("  {0}  ->  {1}" -f $_.id, $_.name) }
