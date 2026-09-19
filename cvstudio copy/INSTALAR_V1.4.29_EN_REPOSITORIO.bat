@echo off
setlocal
set "SRC=%~dp0"
set "DST=%USERPROFILE%\Documents\GitHub\cvstudio"
echo.
echo CVStudio v1.4.29 - instalacion completa
echo Origen: %SRC%
echo Destino: %DST%
echo.
if not exist "%DST%\.git" (
  echo ERROR: No se encontro el repositorio en %DST%
  echo Copia manualmente el contenido de esta carpeta a tu repositorio.
  pause
  exit /b 1
)
robocopy "%SRC%" "%DST%" /E /COPY:DAT /R:1 /W:1 /XD .git /XF INSTALAR_V1.4.29_EN_REPOSITORIO.bat
if errorlevel 8 (
  echo ERROR durante la copia.
  pause
  exit /b 1
)
echo.
echo Archivos instalados. Abri GitHub Desktop y confirma los cambios.
pause
