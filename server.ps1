# Prosty serwer plikow statycznych (bez instalowania czegokolwiek) - http://localhost:8090/
# + API zapisu skor glowy z kreatora (kreator-glowy.html):
#   GET    /api/heads                       -> lista (to samo co skins/heads/index.json)
#   POST   /api/heads?name=x&outfit=y       -> cialo zadania = PNG; zapisuje skins/heads/x.png i odswieza index.json
#   DELETE /api/heads?name=x                -> usuwa skore
$port = 8090
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$heads = Join-Path $root 'skins\heads'
New-Item -ItemType Directory -Force $heads | Out-Null
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serwer dziala: http://localhost:$port/   (zamknij to okno, zeby go wylaczyc)"
Write-Host "Kreator glow:  http://localhost:$port/kreator-glowy.html"
$mime = @{ ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".glb"="model/gltf-binary"; ".json"="application/json"; ".png"="image/png"; ".jpg"="image/jpeg"; ".webp"="image/webp"; ".css"="text/css" }
$utf8 = New-Object System.Text.UTF8Encoding $false

function Read-Index {
  $p = Join-Path $heads 'index.json'
  if (-not (Test-Path -LiteralPath $p)) { return @() }
  try { $j = [IO.File]::ReadAllText($p, $utf8) | ConvertFrom-Json; return @($j) } catch { return @() }
}
# tablica JSON skladana recznie: ConvertTo-Json w PowerShell 5.1 zamienia tablice z jednym elementem w sam obiekt
function To-JsonArray($list) {
  $parts = @($list | Where-Object { $_ -ne $null } | ForEach-Object { ConvertTo-Json -InputObject $_ -Depth 4 -Compress })
  return '[' + ($parts -join ',') + ']'
}
function Write-Index($list) {
  $json = To-JsonArray $list
  [IO.File]::WriteAllText((Join-Path $heads 'index.json'), $json, $utf8)
  return $json
}
function Send($ctx, [int]$code, [string]$type, [byte[]]$bytes) {
  $ctx.Response.StatusCode = $code
  $ctx.Response.ContentType = $type
  $ctx.Response.Headers.Add("Cache-Control", "no-store")
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
}
function SendJson($ctx, [int]$code, [string]$json) { Send $ctx $code "application/json; charset=utf-8" $utf8.GetBytes($json) }
function Get-Q($req, [string]$key) {          # parametr z adresu, zdekodowany jako UTF-8 (QueryString uzywa kodowania systemu)
  foreach ($part in $req.Url.Query.TrimStart('?').Split('&')) {
    $kv = $part.Split('=', 2)
    if ($kv.Length -eq 2 -and $kv[0] -eq $key) { return [Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) }
  }
  return ''
}
function Clean-Name([string]$s) {
  if (-not $s) { return '' }
  $s = $s.ToLowerInvariant().Normalize([Text.NormalizationForm]::FormD)
  $s = [Text.RegularExpressions.Regex]::Replace($s, '\p{Mn}', '')
  $s = $s.Replace([string][char]0x0142, 'l')
  $s = [Text.RegularExpressions.Regex]::Replace($s, '[^a-z0-9_-]+', '-').Trim('-')
  if ($s.Length -gt 40) { $s = $s.Substring(0, 40) }
  return $s
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $req = $ctx.Request
    $rel = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq 'api/heads') {
      if ($req.HttpMethod -eq 'GET') {
        SendJson $ctx 200 (To-JsonArray (Read-Index))
      } elseif ($req.HttpMethod -eq 'POST') {
        $name = Clean-Name (Get-Q $req 'name')
        $outfit = Clean-Name (Get-Q $req 'outfit')
        if (-not $name) { SendJson $ctx 400 '{"error":"brak nazwy"}'; continue }
        $ms = New-Object IO.MemoryStream
        $req.InputStream.CopyTo($ms)
        $bytes = $ms.ToArray()
        if ($bytes.Length -lt 8 -or $bytes.Length -gt 12MB -or $bytes[0] -ne 0x89 -or $bytes[1] -ne 0x50) { SendJson $ctx 400 '{"error":"to nie jest PNG"}'; continue }
        [IO.File]::WriteAllBytes((Join-Path $heads "$name.png"), $bytes)
        $t = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $list = @(Read-Index | Where-Object { $_.name -ne $name })
        $list += [pscustomobject]@{ name = $name; outfit = $outfit; file = "$name.png"; t = $t }
        $json = Write-Index $list
        SendJson $ctx 200 $json
      } elseif ($req.HttpMethod -eq 'DELETE') {
        $name = Clean-Name (Get-Q $req 'name')
        $p = Join-Path $heads "$name.png"
        if ($name -and (Test-Path -LiteralPath $p)) { Remove-Item -LiteralPath $p -Force }
        $json = Write-Index @(Read-Index | Where-Object { $_.name -ne $name })
        SendJson $ctx 200 $json
      } else { SendJson $ctx 405 '{"error":"metoda"}' }
      continue
    }
    if ($rel -eq '') { $rel = 'index.html' }
    $path = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($path.StartsWith($root) -and (Test-Path -LiteralPath $path -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($path)
      $ext = [IO.Path]::GetExtension($path).ToLower()
      if ($mime.ContainsKey($ext)) { $type = $mime[$ext] } else { $type = "application/octet-stream" }
      Send $ctx 200 $type $bytes
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    try { $ctx.Response.StatusCode = 500 } catch {}
  } finally {
    try { $ctx.Response.Close() } catch {}
  }
}
