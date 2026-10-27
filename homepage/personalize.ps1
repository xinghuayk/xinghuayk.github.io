# personalize.ps1 - fill in your GitHub username and site address
#
# Usage, from this folder:
#   powershell -ExecutionPolicy Bypass -File .\personalize.ps1 -Username xyzhou1231
#   powershell -ExecutionPolicy Bypass -File .\personalize.ps1 -Username xyzhou1231 -Domain https://www.example.com/
#
# It rewrites the "your-username" placeholders in index.html, cv.html, 404.html,
# assets/og-cover.svg and README.md. It does not touch your name, papers or
# affiliation - edit those by hand (see README.md).
#
# ASCII only on purpose: Windows PowerShell 5.1 misreads UTF-8 scripts without a BOM.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$')]
    [string]$Username,

    [string]$Domain
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Domain) { $Domain = "https://$Username.github.io/" }
if (-not $Domain.EndsWith('/')) { $Domain += '/' }

$targets = @(
    'index.html',
    'cv.html',
    '404.html',
    'assets\og-cover.svg',
    'README.md'
)

$utf8 = New-Object System.Text.UTF8Encoding($false)
$total = 0

foreach ($rel in $targets) {
    $path = Join-Path $here $rel
    if (-not (Test-Path $path)) {
        Write-Warning "skipped (not found): $rel"
        continue
    }

    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $before = $text

    # Literal replacements, longest / most specific first.
    $text = $text.Replace('https://your-username.github.io/', $Domain)
    $text = $text.Replace('your-username.github.io', "$Username.github.io")
    $text = $text.Replace('github.com/your-username', "github.com/$Username")
    $text = $text.Replace('your-username', $Username)

    if ($text -ne $before) {
        [System.IO.File]::WriteAllText($path, $text, $utf8)
        $count = ([Regex]::Matches($before, 'your-username')).Count
        $total += $count
        Write-Host ("  updated   {0,-20} {1} placeholder(s)" -f $rel, $count)
    }
    else {
        Write-Host ("  unchanged {0}" -f $rel)
    }
}

Write-Host ""
if ($total -eq 0) {
    Write-Host "No placeholders left - nothing to do." -ForegroundColor Yellow
}
else {
    Write-Host "Done. $total placeholder(s) replaced." -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open index.html and replace the demo name, affiliation, email and papers."
Write-Host "  2. Replace assets/portrait.svg with your own photo."
Write-Host "  3. Re-render assets/og-cover.png (open assets/og-cover.svg, screenshot 1200x630)."
Write-Host "  4. Push the folder to the GitHub repository: $Username.github.io"
