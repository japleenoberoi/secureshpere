# Simple HTTP server in PowerShell for serving static files
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3000/")
$listener.Start()
Write-Host "Server running at http://localhost:3000"
Write-Host "Press Ctrl+C to stop"

$root = (Get-Location).Path

$mimeTypes = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "text/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        $filePath = Join-Path $root ($urlPath -replace "/", "\")
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }
            
            $response.ContentType = $contentType
            $response.StatusCode = 200
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # For SPA, serve index.html for non-file routes
            $indexPath = Join-Path $root "index.html"
            if (Test-Path $indexPath) {
                $response.ContentType = "text/html"
                $response.StatusCode = 200
                $bytes = [System.IO.File]::ReadAllBytes($indexPath)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        }
        
        $response.OutputStream.Close()
        Write-Host "$([datetime]::Now.ToString('HH:mm:ss')) $($request.HttpMethod) $urlPath - $($response.StatusCode)"
    } catch {
        Write-Host "Error: $_"
    }
}
