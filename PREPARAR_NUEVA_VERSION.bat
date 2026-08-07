@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -Command "$b=Get-Date -Format 'yyyyMMdd-HHmm'; $p='centro-operaciones-prueba\index.html'; (Get-Content $p -Raw) -replace 'build=\d{8}-\d{4}',('build='+$b) | Set-Content $p -Encoding UTF8; $v=Get-Content 'centro-operaciones-prueba\version.json' -Raw | ConvertFrom-Json; $v.build=$b; $v.releasedAt=(Get-Date).ToString('o'); $v | ConvertTo-Json | Set-Content 'centro-operaciones-prueba\version.json' -Encoding UTF8; Write-Host ('Build actualizado: '+$b)"
pause
