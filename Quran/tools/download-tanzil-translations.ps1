<#
.SYNOPSIS
    Downloads the Tanzil Qur'an translation and tafsir XML files used by the app.

.DESCRIPTION
    Reads the download list from https://tanzil.net/trans/ and stores every
    translation as XML below QuranText/:

        QuranText/Arabic-Tafsir/        ar.*.xml      (tafsir)
        QuranText/English-Translation/  en.*.xml      (English translations)
        QuranText/Translations/         everything else

    Files that are already on disk are kept. When the downloads are done the
    script rewrites QuranText/catalog.json. index.js reads that file to fill
    its tafsir and translation pickers, so the app only ever offers files that
    really exist.

    Tanzil's newer download template puts "----" separator lines inside the
    leading XML comment, which XML forbids, and a few files contain unescaped
    "&" characters or stray control bytes. Such spots are repaired, and every
    file is validated before it is listed in the catalog.

    The country flags used by the source picker are downloaded from
    flagcdn.com into flags/ (one PNG per language that exists on disk).

.PARAMETER Id
    Only handle these translation ids, for example: -Id en.sahih,ur.junagarhi

.PARAMETER SkipLangs
    Language prefixes that are never downloaded. Defaults to fa (Persian).

.PARAMETER Force
    Download again even when the file already exists.

.EXAMPLE
    ./tools/download-tanzil-translations.ps1

.EXAMPLE
    ./tools/download-tanzil-translations.ps1 -Id fr.hamidullah -Force
#>
[CmdletBinding()]
param(
    [string[]] $Id,
    [string[]] $SkipLangs = @('fa'),
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$tafsirFolder = 'QuranText/Arabic-Tafsir'
$englishFolder = 'QuranText/English-Translation'
$transFolder = 'QuranText/Translations'
$catalogPath = Join-Path $root 'QuranText/catalog.json'
$listUrl = 'https://tanzil.net/trans/'
$rtlCodes = @('ar', 'fa', 'ur', 'ps', 'sd', 'ug', 'dv', 'ku')

# Country flag that stands for each language in the picker (ISO 3166-1 alpha-2,
# used as flags/<code>.png). Arabic uses the Saudi flag as requested. Uyghur
# has no entry on purpose and is shown without a flag.
$flagCodes = @{
    am = 'et'; ar = 'sa'; az = 'az'; ber = 'ma'; bg = 'bg'; bn = 'bd'; bs = 'ba';
    cs = 'cz'; de = 'de'; dv = 'mv'; en = 'gb'; es = 'es'; fr = 'fr'; ha = 'ng';
    hi = 'in'; id = 'id'; it = 'it'; ja = 'jp'; ko = 'kr'; ku = 'iq'; ml = 'in';
    ms = 'my'; nl = 'nl'; no = 'no'; pl = 'pl'; ps = 'af'; pt = 'pt'; ro = 'ro';
    ru = 'ru'; sd = 'pk'; so = 'so'; sq = 'al'; sv = 'se'; sw = 'ke'; ta = 'lk';
    tg = 'tj'; th = 'th'; tr = 'tr'; tt = 'ru'; ur = 'pk'; uz = 'uz'; zh = 'cn'
}

# True when .NET can read the whole file as XML.
function Test-XmlFile([string] $path) {
    $reader = $null
    try {
        $reader = [System.Xml.XmlReader]::Create($path)
        while ($reader.Read()) { }
        return $true
    } catch {
        return $false
    } finally {
        if ($reader) { $reader.Dispose() }
    }
}

# Tanzil's newer download template has a few weaknesses that make the parser
# reject a file: "----" separator lines inside the leading XML comment, a
# stray quote in front of an "&", "&" characters that do not start an entity,
# and stray control bytes. Those spots are repaired; everything else is left
# untouched.
function Repair-Xml([string] $text) {
    # 1. "----" separator lines inside the leading comment.
    $start = $text.IndexOf('<!--')
    if ($start -ge 0) {
        $end = $text.IndexOf('-->', $start)
        if ($end -ge 0) {
            $body = $text.Substring($start + 4, $end - $start - 4) -replace '--', '=='
            if ($body.EndsWith('-')) { $body += ' ' }
            $text = $text.Substring(0, $start + 4) + $body + $text.Substring($end)
        }
    }

    # 2. A quote directly in front of an unescaped "&" closes its attribute
    #    too early, so it is written as an entity.
    $text = $text -creplace '"(?=&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);))', '&quot;'

    # 3. "&" that does not start an entity is not allowed in XML.
    $text = $text -creplace '&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)', '&amp;'

    # 4. Stray control characters (one file contains a few broken bytes).
    $text = $text -creplace '[\x00-\x08\x0B\x0C\x0E-\x1F]', ''

    return $text
}

Write-Host "Fetching the translation list from $listUrl ..."
# Windows PowerShell decodes web pages as Latin-1 when the server does not
# announce a charset, which mangles Arabic and other non-Latin names, so the
# bytes are fetched and decoded as UTF-8 by hand.
$webClient = New-Object System.Net.WebClient
$page = [System.Text.Encoding]::UTF8.GetString($webClient.DownloadData($listUrl))

# Every row of the translation table looks like:
#   <tr><td><i class="xx flag"></i>Language</lang><td>Name</name><td>Translator</td><td><a href="/trans/id" title="Download" ...
$entries = @(foreach ($row in [regex]::Matches($page, '(?s)<tr[^>]*>(.*?)</tr>')) {
    $html = $row.Groups[1].Value
    if ($html -notmatch 'title="Download"') { continue }

    $idMatch = [regex]::Match($html, '/trans/([^"]+)"[^>]*title="Download"')
    if (-not $idMatch.Success) { continue }
    $transId = $idMatch.Groups[1].Value

    $cells = [regex]::Matches($html, '(?s)<td>(.*?)(?:</lang>|</name>|</td>)')
    $text = @($cells | ForEach-Object {
        [System.Net.WebUtility]::HtmlDecode((($_.Groups[1].Value -replace '<[^>]+>', '') -replace '\s+', ' ').Trim())
    })
    if ($text.Count -lt 3) { continue }

    $code = ($transId -split '\.')[0]
    [pscustomobject]@{
        id         = $transId
        code       = $code
        rtl        = $rtlCodes -contains $code
        lang       = $text[0]
        name       = $text[1]
        translator = $text[2]
        tafsir     = (($text[1] -match '(?i)tafsir|تفسير|تەفسیر|تهفسیر') -or ($transId -in @('ar.jalalayn', 'ar.muyassar')))
        folder     = $(if ($transId -like 'ar.*') { $tafsirFolder } elseif ($transId -like 'en.*') { $englishFolder } else { $transFolder })
    }
})

if (-not $entries) { throw 'No translations were found on the Tanzil page.' }
Write-Host ("Found {0} translations ({1} tafsirs)." -f $entries.Count, @($entries | Where-Object { $_.tafsir }).Count)

foreach ($folder in @($transFolder, $tafsirFolder, $englishFolder)) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root $folder) | Out-Null
}

$downloaded = 0
$kept = 0
$skipped = 0
$failed = @()

foreach ($entry in $entries) {
    if ($SkipLangs -contains $entry.code) { $skipped++; continue }
    if ($Id -and ($Id -notcontains $entry.id)) { continue }

    $relative = $entry.folder + '/' + $entry.id + '.xml'
    $destination = Join-Path $root $relative

    if ((Test-Path $destination) -and -not $Force) { $kept++; continue }

    $downloaded++
    Write-Host ("[{0}] {1}" -f $downloaded, $entry.id)

    $url = 'https://tanzil.net/trans/?transID=' + $entry.id + '&type=xml'
    $succeeded = $false
    for ($attempt = 1; $attempt -le 3 -and -not $succeeded; $attempt++) {
        try {
            Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing
            $succeeded = $true
        } catch {
            if ($attempt -eq 3) {
                $failed += $entry.id
                Write-Warning ("{0}: {1}" -f $entry.id, $_.Exception.Message)
                Remove-Item -Path $destination -Force -ErrorAction SilentlyContinue
            } else {
                Start-Sleep -Seconds 2
            }
        }
    }

    if ($succeeded -and (Get-Item $destination).Length -lt 10KB) {
        Write-Warning ("{0}: the downloaded file looks suspiciously small." -f $entry.id)
    }
}

# The unparsable spots are repaired and every file that is about to be listed
# in the catalog is checked, so the app never offers a file that the browser
# cannot parse.
$repaired = 0
$invalid = [System.Collections.Generic.List[string]]::new()

foreach ($entry in $entries) {
    $path = Join-Path $root ($entry.folder + '/' + $entry.id + '.xml')
    if (-not (Test-Path $path)) { continue }
    if (Test-XmlFile $path) { continue }

    $original = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $repairedText = Repair-Xml $original
    if ($repairedText -ne $original) {
        # A virus scanner or indexer can hold the file for a moment.
        for ($attempt = 1; $attempt -le 3; $attempt++) {
            try {
                [System.IO.File]::WriteAllText($path, $repairedText, [System.Text.UTF8Encoding]::new($false))
                $repaired++
                Write-Host ("Repaired {0}" -f $entry.id)
                break
            } catch {
                if ($attempt -eq 3) {
                    Write-Warning ("{0}: could not be repaired ({1})" -f $entry.id, $_.Exception.Message)
                } else {
                    Start-Sleep -Milliseconds 500
                }
            }
        }
    }

    if (-not (Test-XmlFile $path)) {
        $invalid.Add($entry.id)
        Write-Warning ("{0}: still not valid XML - it will not appear in the app." -f $entry.id)
    }
}

# One flag image per language that is on disk.
$flagsFolder = Join-Path $root 'flags'
New-Item -ItemType Directory -Force -Path $flagsFolder | Out-Null
$flagCount = 0
$flagLanguages = $entries | Where-Object { $flagCodes.ContainsKey($_.code) } | ForEach-Object { $_.code } | Sort-Object -Unique

foreach ($code in $flagLanguages) {
    $flag = $flagCodes[$code]
    $target = Join-Path $flagsFolder ($flag + '.png')
    if ((Test-Path $target) -and -not $Force) { continue }

    try {
        Invoke-WebRequest -Uri ('https://flagcdn.com/w40/' + $flag + '.png') -OutFile $target -UseBasicParsing
        $flagCount++
    } catch {
        Write-Warning ("Flag {0} ({1}): {2}" -f $flag, $code, $_.Exception.Message)
    }
}

# The catalog only lists files that are actually on disk and valid.
$tafsirs = [System.Collections.Generic.List[object]]::new()
$translations = [System.Collections.Generic.List[object]]::new()

foreach ($entry in $entries) {
    $relative = $entry.folder + '/' + $entry.id + '.xml'
    $path = Join-Path $root $relative
    if (-not (Test-Path $path)) { continue }
    if (-not (Test-XmlFile $path)) { continue }

    $item = [pscustomobject]@{
        id         = $entry.id
        code       = $entry.code
        lang       = $entry.lang
        rtl        = [bool]$entry.rtl
        flag       = $flagCodes[$entry.code]
        name       = $entry.name
        translator = $entry.translator
        path       = $relative
    }
    if ($entry.tafsir) { $tafsirs.Add($item) } else { $translations.Add($item) }
}

$catalog = [ordered]@{
    generated    = (Get-Date -Format 'yyyy-MM-dd')
    source       = $listUrl
    tafsirs      = $tafsirs
    translations = $translations
}
$json = $catalog | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText($catalogPath, $json, [System.Text.UTF8Encoding]::new($false))

Write-Host ''
Write-Host ("Downloaded: {0}   Already present: {1}   Repaired: {2}   Flags: {3}   Skipped ({4}): {5}   Failed: {6}" -f `
        $downloaded, $kept, $repaired, $flagCount, ($SkipLangs -join ', '), $skipped, $failed.Count)
if ($failed.Count -gt 0) {
    Write-Warning ('Failed ids: ' + ($failed -join ', '))
}
if ($invalid.Count -gt 0) {
    Write-Warning ('Invalid ids: ' + ($invalid -join ', '))
}
Write-Host ("Catalog: {0} ({1} tafsirs, {2} translations)" -f $catalogPath, $tafsirs.Count, $translations.Count)
