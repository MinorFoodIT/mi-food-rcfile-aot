REM if not "%minimized%"=="" goto :minimized
REM set minimized=true
@echo off

cd C:\Minor Programs\RCDaily"

start /min cmd /C "node ./genrcfile.js"
goto :EOF
:minimized