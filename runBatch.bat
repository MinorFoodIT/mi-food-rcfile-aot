REM if not "%minimized%"=="" goto :minimized
REM set minimized=true
@echo off

cd C:\Minor Programs\RCDaily"

start /wait cmd /C "node ./genrcfile.js"

cd "C:\Program Files\GenerateSalesTextFile"
start ExportSalesToText.exe"

goto :EOF
:minimized