@echo off
set /p port="Enter a port: "
python -m http.server %port%