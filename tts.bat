@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ps_tts.ps1" -Text "%1" -OutputFile "%2"