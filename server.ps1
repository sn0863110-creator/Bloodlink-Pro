# BloodLink Pro - HTTP Server
$port = 8181
$root = $PSScriptRoot

# Free port if already in use
try {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 600
    }
} catch {}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

# This exact line is matched by tasks.json problemMatcher
Write-Host "BloodLink Pro running at http://localhost:$port"

while ($listener.IsListening) {
    try {
        $ctx  = $listener.GetContext()
        $req  = $ctx.Request
        $res  = $ctx.Response
        $path = $req.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }

        $file = Join-Path $root ($path.TrimStart("/").Replace("/", "\"))

        if (Test-Path $file -PathType Leaf) {
            $ext  = [IO.Path]::GetExtension($file).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".ico"  { "image/x-icon" }
                ".json" { "application/json" }
                default { "application/octet-stream" }
            }
            $bytes = [IO.File]::ReadAllBytes($file)
            $res.ContentType     = $mime
            $res.ContentLength64 = $bytes.Length
            $res.StatusCode      = 200
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode      = 404
            $msg = [Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
            $res.ContentLength64 = $msg.Length
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.OutputStream.Close()
    } catch { }
}
