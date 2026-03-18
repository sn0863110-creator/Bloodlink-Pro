@echo off
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files --disable-web-security --user-data-dir="%~dp0.chrome-dev" "%~dp0index.html"
