@echo off
title SafetyIQ Launcher

:: Start backend silently
start /min "" cmd /c "cd /d C:\Users\DELL\Desktop\SafetyIQ\backend && venv\Scripts\activate && uvicorn main:app --reload"

:: Start frontend silently
start /min "" cmd /c "cd /d C:\Users\DELL\Desktop\SafetyIQ\frontend && npm run dev"

:: Wait a bit for servers to boot up
timeout /t 6 /nobreak >nul

:: Open the frontend in default browser
start http://localhost:5173

exit